package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.service.ResidentComparisonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Resident consumption comparison. Under /api/resident/** so SecurityConfig already limits it to
 * signed-in residents; the household is derived from the caller's identity, never from a parameter.
 */
@RestController
@RequestMapping("/api/resident")
public class ResidentComparisonController {

    private final ResidentComparisonService comparisonService;

    @Autowired
    public ResidentComparisonController(ResidentComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @GetMapping("/consumption-comparison")
    public ResponseEntity<ApiResponse<ResidentComparisonService.Comparison>> comparison(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success("Consumption comparison", comparisonService.build(email)));
    }
}
