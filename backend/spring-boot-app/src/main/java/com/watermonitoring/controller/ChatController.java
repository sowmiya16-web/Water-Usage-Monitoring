package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.ChatRequest;
import com.watermonitoring.dto.ChatResponse;
import com.watermonitoring.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;

/**
 * ChatController — Exposes two chat endpoints:
 *   POST /api/chat/public  — Unauthenticated, landing/login page (static site info only)
 *   POST /api/chat/message — Authenticated, role-scoped (Admin, Community Admin, Resident)
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    @Autowired
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Public endpoint for landing/login page.
     * No authentication required. Public context only.
     */
    @PostMapping("/public")
    public ResponseEntity<ApiResponse<ChatResponse>> chatPublic(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest httpServletRequest) {

        String clientIp = extractClientIp(httpServletRequest);
        ChatResponse response = chatService.processPublicChat(request, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Chat response", response));
    }

    /**
     * Authenticated endpoint for all three dashboards.
     * Extracts user email and role securely from the verified Spring Security context (JWT).
     */
    @PostMapping("/message")
    public ResponseEntity<ApiResponse<ChatResponse>> chatAuthenticated(
            @Valid @RequestBody ChatRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized: Please log in to access the chatbot."));
        }

        String email = auth.getName();
        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();

        // Determine highest role authority from JWT
        String verifiedRole = "ROLE_RESIDENT";
        if (authorities.stream().anyMatch(a -> "ROLE_PROPERTY_ADMIN".equalsIgnoreCase(a.getAuthority()))) {
            verifiedRole = "ROLE_PROPERTY_ADMIN";
        } else if (authorities.stream().anyMatch(a -> "ROLE_COMMUNITY_ADMIN".equalsIgnoreCase(a.getAuthority()))) {
            verifiedRole = "ROLE_COMMUNITY_ADMIN";
        }

        ChatResponse response = chatService.processAuthenticatedChat(email, verifiedRole, request);
        return ResponseEntity.ok(ApiResponse.success("Chat response", response));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
