package com.watermonitoring.dto;

import java.util.List;

public class TranslationBatchRequest {

    private List<String> texts;
    private String targetLanguage;
    private String sourceLanguage = "en";

    public TranslationBatchRequest() {}

    public TranslationBatchRequest(List<String> texts, String targetLanguage) {
        this.texts = texts;
        this.targetLanguage = targetLanguage;
    }

    public List<String> getTexts() {
        return texts;
    }

    public void setTexts(List<String> texts) {
        this.texts = texts;
    }

    public String getTargetLanguage() {
        return targetLanguage != null ? targetLanguage : "en";
    }

    public void setTargetLanguage(String targetLanguage) {
        this.targetLanguage = targetLanguage;
    }

    public String getSourceLanguage() {
        return sourceLanguage != null ? sourceLanguage : "en";
    }

    public void setSourceLanguage(String sourceLanguage) {
        this.sourceLanguage = sourceLanguage;
    }
}
