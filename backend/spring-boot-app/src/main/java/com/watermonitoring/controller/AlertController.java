package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.AlertConfigDto;
import com.watermonitoring.entity.Alert;
import com.watermonitoring.repository.AlertRepository;
import com.watermonitoring.service.AlertEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;
    private final AlertEngineService alertEngineService;

    @Autowired
    public AlertController(AlertRepository alertRepository, AlertEngineService alertEngineService) {
        this.alertRepository = alertRepository;
        this.alertEngineService = alertEngineService;
    }

    // =========================================================
    // 1. GET ALL ALERTS (Admin Dashboard)
    // =========================================================
    @GetMapping
    public ResponseEntity<ApiResponse<List<Alert>>> getAllAlerts() {
        List<Alert> alerts = alertRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(ApiResponse.success("Alerts retrieved successfully", alerts));
    }

    // =========================================================
    // 2. GET ALERTS BY APARTMENT ID
    // =========================================================
    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<List<Alert>>> getAlertsByApartment(@PathVariable Long apartmentId) {
        List<Alert> alerts = alertRepository.findByApartmentIdOrderByCreatedAtDesc(apartmentId);
        return ResponseEntity.ok(ApiResponse.success("Apartment alerts retrieved successfully", alerts));
    }

    // =========================================================
    // 3. GET ALERTS BY USER ID (Resident Portal)
    // =========================================================
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Alert>>> getAlertsByUser(@PathVariable Long userId) {
        List<Alert> alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(ApiResponse.success("Resident alerts retrieved successfully", alerts));
    }

    // =========================================================
    // 4. GET UNREAD BADGE COUNT
    // =========================================================
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) Long userId) {
        long count = 0;
        if (apartmentId != null) {
            count = alertRepository.countByApartmentIdAndAcknowledgedFalse(apartmentId);
        } else if (userId != null) {
            count = alertRepository.countByUserIdAndAcknowledgedFalse(userId);
        } else {
            count = alertRepository.findAll().stream().filter(a -> !Boolean.TRUE.equals(a.getAcknowledged())).count();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", count);
        return ResponseEntity.ok(ApiResponse.success("Unread alert count retrieved successfully", response));
    }

    // =========================================================
    // 5. ACKNOWLEDGE ALERT (Mark as Read)
    // =========================================================
    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<ApiResponse<Alert>> acknowledgeAlert(@PathVariable Long id) {
        return alertRepository.findById(id).map(alert -> {
            alert.setAcknowledged(true);
            Alert saved = alertRepository.save(alert);
            return ResponseEntity.ok(ApiResponse.success("Alert acknowledged successfully", saved));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Alert not found with ID: " + id, null)));
    }

    // =========================================================
    // 6. ACKNOWLEDGE ALL ALERTS
    // =========================================================
    @PutMapping("/acknowledge-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> acknowledgeAllAlerts(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) Long userId) {
        List<Alert> targetAlerts;
        if (apartmentId != null) {
            targetAlerts = alertRepository.findByApartmentIdOrderByCreatedAtDesc(apartmentId);
        } else if (userId != null) {
            targetAlerts = alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else {
            targetAlerts = alertRepository.findAll();
        }

        int count = 0;
        for (Alert alert : targetAlerts) {
            if (!Boolean.TRUE.equals(alert.getAcknowledged())) {
                alert.setAcknowledged(true);
                alertRepository.save(alert);
                count++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("acknowledgedCount", count);
        return ResponseEntity.ok(ApiResponse.success("All alerts acknowledged successfully", result));
    }

    // =========================================================
    // 7. RESOLVE / REOPEN ALERT
    // =========================================================
    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Alert>> resolveAlert(@PathVariable Long id) {
        return alertRepository.findById(id).map(alert -> {
            String newStatus = "ACTIVE".equalsIgnoreCase(alert.getStatus()) ? "RESOLVED" : "ACTIVE";
            alert.setStatus(newStatus);
            if ("RESOLVED".equalsIgnoreCase(newStatus)) {
                alert.setAcknowledged(true);
            }
            Alert saved = alertRepository.save(alert);
            return ResponseEntity.ok(ApiResponse.success("Alert status updated to " + newStatus, saved));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Alert not found with ID: " + id, null)));
    }

    // =========================================================
    // 8. TRIGGER INSTANT ALERT EVALUATION
    // =========================================================
    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerEvaluation() {
        int generated = alertEngineService.evaluateAllAlertConditions();
        Map<String, Object> res = new HashMap<>();
        res.put("generatedAlerts", generated);
        return ResponseEntity.ok(ApiResponse.success("Alert evaluation executed successfully", res));
    }

    // =========================================================
    // 9. CONFIGURABLE THRESHOLD APIS
    // =========================================================
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<AlertConfigDto>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success("Alert configuration retrieved successfully", alertEngineService.getConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<AlertConfigDto>> updateConfig(@RequestBody AlertConfigDto configDto) {
        AlertConfigDto updated = alertEngineService.updateConfig(configDto);
        return ResponseEntity.ok(ApiResponse.success("Alert configuration updated successfully", updated));
    }
}
