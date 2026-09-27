package com.watermonitoring.dto.auth;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String targetDashboard;

    public AuthResponse() {}

    public AuthResponse(String token, Long userId, String fullName, String email, String role, String targetDashboard) {
        this.token = token;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.targetDashboard = targetDashboard;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getTargetDashboard() { return targetDashboard; }
    public void setTargetDashboard(String targetDashboard) { this.targetDashboard = targetDashboard; }
}
