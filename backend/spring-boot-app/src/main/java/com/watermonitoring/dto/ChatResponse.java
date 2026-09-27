package com.watermonitoring.dto;

public class ChatResponse {

    private String reply;
    private String language;

    public ChatResponse() {}

    public ChatResponse(String reply) {
        this.reply = reply;
        this.language = "en";
    }

    public ChatResponse(String reply, String language) {
        this.reply = reply;
        this.language = language;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
