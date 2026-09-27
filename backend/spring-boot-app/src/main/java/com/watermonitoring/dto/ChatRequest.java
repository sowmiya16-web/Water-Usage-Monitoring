package com.watermonitoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class ChatRequest {

    @NotBlank(message = "Message cannot be blank")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String message;

    // Matches the 50+ codes in TranslationService.SUPPORTED_LANGUAGES
    // (plain ISO 639-1 codes plus a couple of hyphenated variants like
    // zh-CN/zh-TW). Any code outside the catalog just falls back to
    // English via TranslationService#getLanguageName — this pattern only
    // guards shape/length, not the exact allow-list.
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "Invalid language code")
    private String language = "en";

    // Which page/route the user is currently viewing (e.g. "/resident/current-bill").
    // Used only as a lookup key into a server-side page registry — never
    // interpolated into the AI prompt as free text — so it carries no
    // prompt-injection risk regardless of what a client sends.
    @Size(max = 200, message = "currentPage must not exceed 200 characters")
    @Pattern(regexp = "^[a-zA-Z0-9/_-]*$", message = "currentPage contains invalid characters")
    private String currentPage;

    // Recent prior turns of THIS conversation, supplied by the client so
    // Gemini can hold context across messages (ChatGPT-style multi-turn
    // chat) without the server persisting chat sessions. Capped to keep
    // prompt size and abuse potential bounded.
    @Valid
    @Size(max = 20, message = "history must not exceed 20 turns")
    private List<ChatTurn> history = new ArrayList<>();

    public ChatRequest() {}

    public ChatRequest(String message) {
        this.message = message;
        this.language = "en";
    }

    public ChatRequest(String message, String language) {
        this.message = message;
        this.language = (language != null && !language.isBlank()) ? language : "en";
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLanguage() {
        return language != null ? language : "en";
    }

    public void setLanguage(String language) {
        this.language = (language != null && !language.isBlank()) ? language : "en";
    }

    public String getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(String currentPage) {
        this.currentPage = currentPage;
    }

    public List<ChatTurn> getHistory() {
        return history != null ? history : new ArrayList<>();
    }

    public void setHistory(List<ChatTurn> history) {
        this.history = history;
    }
}
