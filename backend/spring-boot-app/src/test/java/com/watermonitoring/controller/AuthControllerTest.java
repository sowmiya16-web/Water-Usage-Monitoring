package com.watermonitoring.controller;

import com.watermonitoring.dto.auth.AuthResponse;
import com.watermonitoring.dto.auth.LoginRequest;
import com.watermonitoring.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    void testLoginEndpointSuccess() {
        AuthResponse mockResponse = new AuthResponse("token-123", 1L, "Admin User", "admin@watermonitor.com", "admin", "/admin/dashboard");
        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        LoginRequest loginRequest = new LoginRequest("admin@watermonitor.com", "Admin@123", "admin");
        ResponseEntity<?> response = authController.login(loginRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
