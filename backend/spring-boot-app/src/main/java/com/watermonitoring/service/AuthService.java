package com.watermonitoring.service;

import com.watermonitoring.dto.auth.AuthResponse;
import com.watermonitoring.dto.auth.LoginRequest;
import com.watermonitoring.dto.auth.RegisterRequest;
import com.watermonitoring.entity.Role;
import com.watermonitoring.entity.User;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.RoleRepository;
import com.watermonitoring.repository.UserRepository;
import com.watermonitoring.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired
    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        // Check static demo credentials for instant testing
        if ("resident@watermonitor.com".equalsIgnoreCase(request.getEmail()) && "Resident@123".equals(request.getPassword())) {
            String token = jwtService.generateToken(request.getEmail(), "ROLE_RESIDENT");
            return new AuthResponse(token, 101L, "Resident User", request.getEmail(), "user", "/resident/dashboard");
        }

        if ("admin@watermonitor.com".equalsIgnoreCase(request.getEmail()) && "Admin@123".equals(request.getPassword())) {
            String token = jwtService.generateToken(request.getEmail(), "ROLE_COMMUNITY_ADMIN");
            return new AuthResponse(token, 103L, "Community Admin", request.getEmail(), "community_admin", "/community-admin/dashboard");
        }

        if ("communityadmin@watermonitor.com".equalsIgnoreCase(request.getEmail()) && "Community@123".equals(request.getPassword())) {
            String token = jwtService.generateToken(request.getEmail(), "ROLE_PROPERTY_ADMIN");
            return new AuthResponse(token, 102L, "Property Admin", request.getEmail(), "admin", "/admin/dashboard");
        }

        if ("community@aquaplus.com".equalsIgnoreCase(request.getEmail()) && "Community@123".equals(request.getPassword())) {
            String token = jwtService.generateToken(request.getEmail(), "ROLE_COMMUNITY_ADMIN");
            return new AuthResponse(token, 103L, "Community Admin", request.getEmail(), "community_admin", "/community-admin/dashboard");
        }

        // Database lookup
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        String userRole = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("ROLE_RESIDENT");

        String clientRole = "user";
        String dashboard = "/resident/dashboard";

        if ("ROLE_PROPERTY_ADMIN".equals(userRole)) {
            clientRole = "admin";
            dashboard = "/admin/dashboard";
        }

        String token = jwtService.generateToken(user.getEmail(), userRole);
        return new AuthResponse(token, user.getUserId(), user.getFullName(), user.getEmail(), clientRole, dashboard);
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email address already registered: " + email);
        }

        String fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                ? request.getFullName().trim()
                : email.substring(0, email.indexOf('@'));

        User user = new User(
                fullName,
                email,
                request.getPhone(),
                passwordEncoder.encode(request.getPassword())
        );

        String roleName = request.getRole() != null ? request.getRole() : "ROLE_RESIDENT";
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getEmail(), roleName);

        return new AuthResponse(token, savedUser.getUserId(), savedUser.getFullName(), savedUser.getEmail(), "user", "/resident/dashboard");
    }

    public AuthResponse getCurrentUser(String email) {
        if ("admin@watermonitor.com".equalsIgnoreCase(email)) {
            String token = jwtService.generateToken(email, "ROLE_COMMUNITY_ADMIN");
            return new AuthResponse(token, 103L, "Community Admin", email, "community_admin", "/community-admin/dashboard");
        }

        if ("communityadmin@watermonitor.com".equalsIgnoreCase(email)) {
            String token = jwtService.generateToken(email, "ROLE_PROPERTY_ADMIN");
            return new AuthResponse(token, 102L, "Property Admin", email, "admin", "/admin/dashboard");
        }

        if ("community@aquaplus.com".equalsIgnoreCase(email)) {
            String token = jwtService.generateToken(email, "ROLE_COMMUNITY_ADMIN");
            return new AuthResponse(token, 103L, "Community Admin", email, "community_admin", "/community-admin/dashboard");
        }

        if ("resident@watermonitor.com".equalsIgnoreCase(email)) {
            String token = jwtService.generateToken(email, "ROLE_RESIDENT");
            return new AuthResponse(token, 101L, "Resident User", email, "user", "/resident/dashboard");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String userRole = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("ROLE_RESIDENT");

        String clientRole = "ROLE_PROPERTY_ADMIN".equals(userRole) ? "admin" : "user";
        String dashboard = "admin".equals(clientRole) ? "/admin/dashboard" : "/resident/dashboard";
        String token = jwtService.generateToken(user.getEmail(), userRole);

        return new AuthResponse(token, user.getUserId(), user.getFullName(), user.getEmail(), clientRole, dashboard);
    }
}

