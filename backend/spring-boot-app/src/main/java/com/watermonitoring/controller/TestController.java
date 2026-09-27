package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> testBackend() {
        Map<String, Object> statusData = new HashMap<>();
        statusData.put("system", "Water Usage Monitoring Backend");
        statusData.put("status", "Running");
        statusData.put("port", 8080);
        statusData.put("database", "MySQL (water_monitoring)");

        return ResponseEntity.ok(ApiResponse.success("Water Monitoring Backend is running successfully", statusData));
    }
}
