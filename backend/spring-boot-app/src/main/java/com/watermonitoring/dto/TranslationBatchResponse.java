package com.watermonitoring.dto;

import java.util.Map;

public class TranslationBatchResponse {

    private String targetLanguage;
    private Map<String, String> translations;

    public TranslationBatchResponse() {}

    public TranslationBatchResponse(String targetLanguage, Map<String, String> translations) {
        this.targetLanguage = targetLanguage;
        this.translations = translations;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }

    public void setTargetLanguage(String targetLanguage) {
        this.targetLanguage = targetLanguage;
    }

    public Map<String, String> getTranslations() {
        return translations;
    }

    public void setTranslations(Map<String, String> translations) {
        this.translations = translations;
    }
}
