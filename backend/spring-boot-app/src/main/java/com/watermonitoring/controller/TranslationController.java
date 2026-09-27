package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.TranslationBatchRequest;
import com.watermonitoring.dto.TranslationBatchResponse;
import com.watermonitoring.service.chat.GeminiKeyManager;
import com.watermonitoring.service.chat.GeminiTranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * TranslationController — Public API endpoints for dynamic frontend translation.
 * Exposes batch translation powered by Google Gemini with 3-key rotation and caching.
 */
@RestController
@RequestMapping("/api/translate")
public class TranslationController {

    private final GeminiTranslationService translationService;
    private final GeminiKeyManager keyManager;

    @Autowired
    public TranslationController(GeminiTranslationService translationService, GeminiKeyManager keyManager) {
        this.translationService = translationService;
        this.keyManager = keyManager;
    }

    /**
     * Batch translates an array of UI strings to the target language.
     * Accessible publicly without requiring authentication.
     */
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<TranslationBatchResponse>> translateBatch(
            @RequestBody TranslationBatchRequest request) {

        if (request == null || request.getTexts() == null || request.getTexts().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(
                    "Empty batch",
                    new TranslationBatchResponse(request != null ? request.getTargetLanguage() : "en", Map.of())
            ));
        }

        String targetLang = request.getTargetLanguage();
        List<String> texts = request.getTexts();

        Map<String, String> translations = translationService.translateBatch(texts, targetLang);
        TranslationBatchResponse response = new TranslationBatchResponse(targetLang, translations);

        return ResponseEntity.ok(ApiResponse.success("Translations generated successfully", response));
    }

    /**
     * Status endpoint to inspect translation readiness and key configuration.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success("Translation status", Map.of(
                "activeGeminiKeys", keyManager.getActiveKeyCount(),
                "supportedLanguages", List.of("en", "ta", "hi", "te", "ml", "kn")
        )));
    }
}
