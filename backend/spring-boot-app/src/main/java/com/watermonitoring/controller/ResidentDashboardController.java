package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.service.ResidentDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Resident Dashboard data. Lives under /api/resident/** so SecurityConfig
 * already restricts it to signed-in residents; the apartment is derived
 * from the caller's own identity, never from a request parameter.
 */
@RestController
@RequestMapping("/api/resident")
public class ResidentDashboardController {

    private final ResidentDashboardService dashboardService;

    @Autowired
    public ResidentDashboardController(ResidentDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ResidentDashboardService.Dashboard>> getDashboard(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success("Resident dashboard", dashboardService.build(email)));
    }
}
