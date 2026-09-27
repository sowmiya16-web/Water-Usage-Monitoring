package com.watermonitoring.service.chat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * GeminiTranslationService — Performs dynamic batch translation of UI text strings
 * using Google Gemini API with 3-key rotation, failover, and multi-tier caching.
 */
@Service
public class GeminiTranslationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiTranslationService.class);

    private final GeminiKeyManager keyManager;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/}")
    private String geminiApiUrl;

    @Value("${gemini.api.model:gemini-flash-latest}")
    private String defaultModel;

    // In-memory cache: targetLang -> (sourceText -> translatedText)
    private final Map<String, ConcurrentHashMap<String, String>> translationCache = new ConcurrentHashMap<>();

    private static final Map<String, String> LANGUAGE_NAMES = Map.of(
            "en", "English",
            "ta", "Tamil (தமிழ்)",
            "hi", "Hindi (हिन्दी)",
            "te", "Telugu (తెలుగు)",
            "ml", "Malayalam (മലയാളം)",
            "kn", "Kannada (ಕನ್ನಡ)"
    );

    @Autowired
    public GeminiTranslationService(GeminiKeyManager keyManager) {
        this.keyManager = keyManager;
    }

    /**
     * Batch translates a list of text strings into the target language.
     * Checks memory cache first. Calls Gemini for uncached strings using rotated keys.
     */
    public Map<String, String> translateBatch(List<String> texts, String targetLang) {
        if (texts == null || texts.isEmpty()) {
            return Collections.emptyMap();
        }

        String lang = (targetLang == null || targetLang.isBlank()) ? "en" : targetLang.toLowerCase().trim();

        // If English, return self mapping
        if ("en".equals(lang)) {
            Map<String, String> identityMap = new HashMap<>();
            for (String t : texts) {
                if (t != null) identityMap.put(t, t);
            }
            return identityMap;
        }

        ConcurrentHashMap<String, String> langCache = translationCache.computeIfAbsent(lang, k -> new ConcurrentHashMap<>());

        Map<String, String> resultMap = new HashMap<>();
        List<String> uncachedTexts = new ArrayList<>();

        for (String original : texts) {
            if (original == null || original.isBlank()) continue;
            String clean = original.trim();
            if (langCache.containsKey(clean)) {
                resultMap.put(clean, langCache.get(clean));
            } else {
                uncachedTexts.add(clean);
            }
        }

        if (uncachedTexts.isEmpty()) {
            return resultMap;
        }

        // Chunk uncached texts (max 35 items per prompt to keep JSON prompt small and fast)
        int chunkSize = 35;
        for (int i = 0; i < uncachedTexts.size(); i += chunkSize) {
            List<String> chunk = uncachedTexts.subList(i, Math.min(i + chunkSize, uncachedTexts.size()));
            Map<String, String> chunkTranslations = translateChunkWithGemini(chunk, lang);

            for (Map.Entry<String, String> entry : chunkTranslations.entrySet()) {
                langCache.put(entry.getKey(), entry.getValue());
                resultMap.put(entry.getKey(), entry.getValue());
            }

            // Fill missing as original to avoid empty results
            for (String s : chunk) {
                if (!resultMap.containsKey(s)) {
                    resultMap.put(s, s);
                }
            }
        }

        return resultMap;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> translateChunkWithGemini(List<String> chunk, String targetLang) {
        Map<String, String> fallbackMap = new HashMap<>();
        for (String s : chunk) fallbackMap.put(s, s);

        List<String> candidateKeys = keyManager.getCandidateKeysForFailover();
        if (candidateKeys.isEmpty()) {
            log.warn("[GeminiTranslationService] No Gemini API keys configured.");
            return fallbackMap;
        }

        String targetLangName = LANGUAGE_NAMES.getOrDefault(targetLang, targetLang);
        String baseUrl = geminiApiUrl.endsWith("/") ? geminiApiUrl : geminiApiUrl + "/";
        List<String> modelsToTry = List.of(
                "gemini-flash-latest",
                "gemini-3.5-flash-lite",
                "gemini-3.8-flash",
                "gemini-3.5-flash"
        );

        String prompt = buildTranslationPrompt(chunk, targetLangName, targetLang);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        Map<String, Object> userPart = new LinkedHashMap<>();
        userPart.put("text", prompt);
        Map<String, Object> userContent = new LinkedHashMap<>();
        userContent.put("role", "user");
        userContent.put("parts", List.of(userPart));
        requestBody.put("contents", List.of(userContent));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("maxOutputTokens", 2048);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(requestBody, headers);

        // Try candidate keys with failover
        for (String apiKey : candidateKeys) {
            for (String model : modelsToTry) {
                try {
                    String endpoint = baseUrl + model + ":generateContent?key=" + apiKey;
                    ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, httpRequest, Map.class);

                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        Map<String, Object> body = response.getBody();
                        List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                        if (candidates != null && !candidates.isEmpty()) {
                            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                            if (content != null) {
                                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                                if (parts != null && !parts.isEmpty()) {
                                    String rawText = (String) parts.get(0).get("text");
                                    Map<String, String> parsed = parseJsonTranslations(rawText);
                                    if (!parsed.isEmpty()) {
                                        keyManager.recordSuccess(apiKey);
                                        log.info("[GeminiTranslationService] Successfully translated {} phrases to {} using model {} with key {}",
                                                parsed.size(), targetLang, model, GeminiKeyManager.maskKey(apiKey));
                                        return parsed;
                                    }
                                }
                            }
                        }
                    }
                } catch (HttpStatusCodeException e) {
                    boolean isRateLimit = (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS || e.getStatusCode().value() == 429);
                    boolean isAuthError = (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN);

                    if (isRateLimit || isAuthError) {
                        keyManager.recordFailure(apiKey, isRateLimit);
                        log.warn("[GeminiTranslationService] Key {} hit HTTP {}. Moving to next key...",
                                GeminiKeyManager.maskKey(apiKey), e.getStatusCode());
                        break; // move to next key
                    } else {
                        // 503 (high demand), 404, etc. are model-specific — try next model!
                        log.warn("[GeminiTranslationService] Model '{}' returned HTTP {}. Trying next model...",
                                model, e.getStatusCode());
                        continue;
                    }
                } catch (Exception e) {
                    log.warn("[GeminiTranslationService] Exception on model '{}' with key {}: {}. Trying next model...",
                            model, GeminiKeyManager.maskKey(apiKey), e.getMessage());
                }
            }
        }

        log.warn("[GeminiTranslationService] All keys/models failed for chunk. Returning original texts as fallback.");
        return fallbackMap;
    }

    private String buildTranslationPrompt(List<String> chunk, String targetLangName, String targetLang) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert UI localization engine for a modern Smart Water Usage Monitoring application.\n");
        sb.append("Translate the following list of UI labels and messages from English into ").append(targetLangName).append(" (").append(targetLang).append(").\n\n");
        sb.append("RULES:\n");
        sb.append("1. Return ONLY a single raw valid JSON object: {\"Original English\": \"Translation\"}.\n");
        sb.append("2. Do NOT add any markdown formatting, backticks, or explanation.\n");
        sb.append("3. Keep proper names like 'Aqua Plus', units like 'KL', 'L/min', 'kWh' appropriate in context.\n");
        sb.append("4. Ensure natural, accurate phrasing suited for dashboard UI, navigation, metrics, and buttons.\n\n");
        sb.append("Phrases to translate:\n");
        try {
            sb.append(objectMapper.writeValueAsString(chunk));
        } catch (Exception e) {
            sb.append(chunk.toString());
        }
        return sb.toString();
    }

    private Map<String, String> parseJsonTranslations(String rawText) {
        if (rawText == null || rawText.isBlank()) return Collections.emptyMap();

        String cleaned = rawText.trim();
        // Strip markdown codeblocks ```json ... ``` if present
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();

        try {
            return objectMapper.readValue(cleaned, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            log.warn("[GeminiTranslationService] Failed to parse JSON response: '{}'. Error: {}", cleaned, e.getMessage());
            return Collections.emptyMap();
        }
    }
}
