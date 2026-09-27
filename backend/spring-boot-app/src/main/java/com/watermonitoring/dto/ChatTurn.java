package com.watermonitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * ChatTurn — One prior message in the conversation (sent by the client so
 * Gemini can hold a multi-turn conversation, ChatGPT-style, without the
 * server needing to persist chat sessions). Treated exactly like any other
 * user-supplied text: it becomes a conversation turn passed to Gemini, never
 * interpreted as an instruction to the server itself.
 */
public class ChatTurn {

    @NotBlank
    @Pattern(regexp = "^(user|model)$", message = "role must be 'user' or 'model'")
    private String role;

    @NotBlank
    @Size(max = 2000, message = "Turn text must not exceed 2000 characters")
    private String text;

    public ChatTurn() {}

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
