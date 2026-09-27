package com.watermonitoring.service;

import com.watermonitoring.dto.auth.AuthResponse;
import com.watermonitoring.dto.auth.LoginRequest;
import com.watermonitoring.entity.User;
import com.watermonitoring.repository.RoleRepository;
import com.watermonitoring.repository.UserRepository;
import com.watermonitoring.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {}

    @Test
    void testDemoAdminLoginSuccess() {
        LoginRequest loginRequest = new LoginRequest("admin@watermonitor.com", "Admin@123", "admin");
        when(jwtService.generateToken(anyString(), anyString())).thenReturn("mocked-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("admin", response.getRole());
        assertEquals("admin@watermonitor.com", response.getEmail());
        assertEquals("mocked-jwt-token", response.getToken());
    }

    @Test
    void testDemoResidentLoginSuccess() {
        LoginRequest loginRequest = new LoginRequest("resident@watermonitor.com", "Resident@123", "user");
        when(jwtService.generateToken(anyString(), anyString())).thenReturn("mocked-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("user", response.getRole());
        assertEquals("resident@watermonitor.com", response.getEmail());
        assertEquals("mocked-jwt-token", response.getToken());
    }

    @Test
    void testGetCurrentUserAdmin() {
        when(jwtService.generateToken(anyString(), anyString())).thenReturn("mocked-jwt-token");

        AuthResponse response = authService.getCurrentUser("admin@watermonitor.com");

        assertNotNull(response);
        assertEquals("admin", response.getRole());
        assertEquals("Property Admin", response.getFullName());
    }
}
