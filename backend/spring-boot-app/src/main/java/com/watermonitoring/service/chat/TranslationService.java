package com.watermonitoring.service.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * TranslationService — Holds the 100+ language catalog (mirrors the
 * frontend's translationData.js) and, if a Google Cloud Translation API
 * key is configured, can additionally machine-translate raw strings.
 *
 * Gemini itself auto-detects the user's language and generates chat
 * replies natively in it (see GeminiService), so this service is not
 * required for the chatbot to be multilingual — it's a fallback layer
 * only, and this catalog is really just the site's translate-switcher
 * dropdown list. If no key is configured, translateToEnglish/
 * translateFromEnglish simply pass text through unchanged.
 */
@Service
public class TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationService.class);

    @Value("${google.translate.api.key:}")
    private String translateApiKey;

    @Value("${google.translate.api.url:https://translation.googleapis.com/language/translate/v2}")
    private String translateApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Mirrors the frontend's shared language catalog (translationData.js) —
    // codes must stay in sync so a language picked in the UI maps to a
    // name Gemini can be reliably instructed to respond in.
    public static final Map<String, String> SUPPORTED_LANGUAGES = Map.ofEntries(
            Map.entry("en", "English"),
            Map.entry("ta", "Tamil (தமிழ்)"),
            Map.entry("hi", "Hindi (हिन्दी)"),
            Map.entry("te", "Telugu (తెలుగు)"),
            Map.entry("ml", "Malayalam (മലയാളം)"),
            Map.entry("kn", "Kannada (ಕನ್ನಡ)"),
            Map.entry("bn", "Bengali (বাংলা)"),
            Map.entry("mr", "Marathi (मराठी)"),
            Map.entry("gu", "Gujarati (ગુજરાતી)"),
            Map.entry("pa", "Punjabi (ਪੰਜਾਬੀ)"),
            Map.entry("ur", "Urdu (اردو)"),
            Map.entry("or", "Odia (ଓଡ଼ିଆ)"),
            Map.entry("as", "Assamese (অসমীয়া)"),
            Map.entry("sd", "Sindhi (سنڌي)"),
            Map.entry("ne", "Nepali (नेपाली)"),
            Map.entry("si", "Sinhala (සිංහල)"),
            Map.entry("my", "Burmese (မြန်မာ)"),
            Map.entry("km", "Khmer (ខ្មែរ)"),
            Map.entry("lo", "Lao (ລາວ)"),
            Map.entry("th", "Thai (ไทย)"),
            Map.entry("vi", "Vietnamese (Tiếng Việt)"),
            Map.entry("id", "Indonesian (Bahasa Indonesia)"),
            Map.entry("ms", "Malay (Bahasa Melayu)"),
            Map.entry("jw", "Javanese (Basa Jawa)"),
            Map.entry("su", "Sundanese (Basa Sunda)"),
            Map.entry("fil", "Filipino"),
            Map.entry("ceb", "Cebuano"),
            Map.entry("hmn", "Hmong"),
            Map.entry("mn", "Mongolian (Монгол)"),
            Map.entry("zh-CN", "Chinese Simplified (简体中文)"),
            Map.entry("zh-TW", "Chinese Traditional (繁體中文)"),
            Map.entry("ja", "Japanese (日本語)"),
            Map.entry("ko", "Korean (한국어)"),
            Map.entry("ar", "Arabic (العربية)"),
            Map.entry("he", "Hebrew (עברית)"),
            Map.entry("fa", "Persian (فارسی)"),
            Map.entry("ps", "Pashto (پښتو)"),
            Map.entry("ku", "Kurdish (Kurdî)"),
            Map.entry("tr", "Turkish (Türkçe)"),
            Map.entry("az", "Azerbaijani (Azərbaycan)"),
            Map.entry("ka", "Georgian (ქართული)"),
            Map.entry("hy", "Armenian (Հայերեն)"),
            Map.entry("kk", "Kazakh (Қазақ)"),
            Map.entry("ky", "Kyrgyz (Кыргызча)"),
            Map.entry("uz", "Uzbek (Oʻzbek)"),
            Map.entry("tg", "Tajik (Тоҷикӣ)"),
            Map.entry("tk", "Turkmen (Türkmen)"),
            Map.entry("ug", "Uyghur"),
            Map.entry("ru", "Russian (Русский)"),
            Map.entry("uk", "Ukrainian (Українська)"),
            Map.entry("be", "Belarusian (Беларуская)"),
            Map.entry("pl", "Polish (Polski)"),
            Map.entry("cs", "Czech (Čeština)"),
            Map.entry("sk", "Slovak (Slovenčina)"),
            Map.entry("sl", "Slovenian (Slovenščina)"),
            Map.entry("hr", "Croatian (Hrvatski)"),
            Map.entry("sr", "Serbian (Српски)"),
            Map.entry("bs", "Bosnian (Bosanski)"),
            Map.entry("mk", "Macedonian (Македонски)"),
            Map.entry("sq", "Albanian (Shqip)"),
            Map.entry("bg", "Bulgarian (Български)"),
            Map.entry("ro", "Romanian (Română)"),
            Map.entry("hu", "Hungarian (Magyar)"),
            Map.entry("de", "German (Deutsch)"),
            Map.entry("nl", "Dutch (Nederlands)"),
            Map.entry("fy", "Frisian (Frysk)"),
            Map.entry("fr", "French (Français)"),
            Map.entry("es", "Spanish (Español)"),
            Map.entry("pt", "Portuguese (Português)"),
            Map.entry("it", "Italian (Italiano)"),
            Map.entry("ca", "Catalan (Català)"),
            Map.entry("gl", "Galician (Galego)"),
            Map.entry("eu", "Basque (Euskara)"),
            Map.entry("co", "Corsican (Corsu)"),
            Map.entry("sv", "Swedish (Svenska)"),
            Map.entry("no", "Norwegian (Norsk)"),
            Map.entry("da", "Danish (Dansk)"),
            Map.entry("fi", "Finnish (Suomi)"),
            Map.entry("is", "Icelandic (Íslenska)"),
            Map.entry("et", "Estonian (Eesti)"),
            Map.entry("lv", "Latvian (Latviešu)"),
            Map.entry("lt", "Lithuanian (Lietuvių)"),
            Map.entry("el", "Greek (Ελληνικά)"),
            Map.entry("mt", "Maltese (Malti)"),
            Map.entry("ga", "Irish (Gaeilge)"),
            Map.entry("gd", "Scots Gaelic (Gàidhlig)"),
            Map.entry("cy", "Welsh (Cymraeg)"),
            Map.entry("lb", "Luxembourgish (Lëtzebuergesch)"),
            Map.entry("eo", "Esperanto"),
            Map.entry("la", "Latin (Latina)"),
            Map.entry("yi", "Yiddish"),
            Map.entry("sw", "Swahili (Kiswahili)"),
            Map.entry("am", "Amharic (አማርኛ)"),
            Map.entry("so", "Somali (Soomaali)"),
            Map.entry("ha", "Hausa"),
            Map.entry("ig", "Igbo"),
            Map.entry("yo", "Yoruba (Yorùbá)"),
            Map.entry("zu", "Zulu (isiZulu)"),
            Map.entry("xh", "Xhosa (isiXhosa)"),
            Map.entry("st", "Sesotho"),
            Map.entry("sn", "Shona (chiShona)"),
            Map.entry("ny", "Chichewa"),
            Map.entry("rw", "Kinyarwanda"),
            Map.entry("mg", "Malagasy"),
            Map.entry("af", "Afrikaans"),
            Map.entry("sm", "Samoan (Gagana Sāmoa)"),
            Map.entry("mi", "Māori (Te Reo Māori)"),
            Map.entry("haw", "Hawaiian"),
            Map.entry("ht", "Haitian Creole (Kreyòl Ayisyen)")
    );

    /**
     * Checks if Google Cloud Translation API is configured.
     */
    public boolean isGoogleTranslateConfigured() {
        return translateApiKey != null && !translateApiKey.isBlank() && !"YOUR_GOOGLE_TRANSLATE_API_KEY".equals(translateApiKey);
    }

    /**
     * Translates user message from source language to English.
     */
    public String translateToEnglish(String text, String sourceLanguage) {
        if (text == null || text.isBlank() || "en".equalsIgnoreCase(sourceLanguage)) {
            return text;
        }

        if (!isGoogleTranslateConfigured()) {
            log.debug("Google Translate API key not configured; passing original text directly to Gemini.");
            return text;
        }

        try {
            return callGoogleTranslate(text, sourceLanguage, "en");
        } catch (Exception e) {
            log.warn("Google Translate to English failed ({}): {}. Falling back to original text.", sourceLanguage, e.getMessage());
            return text;
        }
    }

    /**
     * Translates English text to target user language.
     */
    public String translateFromEnglish(String englishText, String targetLanguage) {
        if (englishText == null || englishText.isBlank() || "en".equalsIgnoreCase(targetLanguage)) {
            return englishText;
        }

        if (!isGoogleTranslateConfigured()) {
            log.debug("Google Translate API key not configured; returning raw response.");
            return englishText;
        }

        try {
            return callGoogleTranslate(englishText, "en", targetLanguage);
        } catch (Exception e) {
            log.warn("Google Translate to '{}' failed: {}. Returning English text.", targetLanguage, e.getMessage());
            return englishText;
        }
    }

    @SuppressWarnings("unchecked")
    private String callGoogleTranslate(String text, String sourceLang, String targetLang) {
        String url = translateApiUrl + "?key=" + translateApiKey;

        Map<String, Object> body = new HashMap<>();
        body.put("q", text);
        if (sourceLang != null && !sourceLang.isBlank()) {
            body.put("source", sourceLang);
        }
        body.put("target", targetLang);
        body.put("format", "text");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> respBody = response.getBody();
            Map<String, Object> data = (Map<String, Object>) respBody.get("data");
            if (data != null) {
                List<Map<String, Object>> translations = (List<Map<String, Object>>) data.get("translations");
                if (translations != null && !translations.isEmpty()) {
                    return (String) translations.get(0).get("translatedText");
                }
            }
        }

        return text;
    }

    /**
     * Returns language name for prompt instructions.
     */
    public String getLanguageName(String code) {
        return SUPPORTED_LANGUAGES.getOrDefault(code, "English");
    }
}
