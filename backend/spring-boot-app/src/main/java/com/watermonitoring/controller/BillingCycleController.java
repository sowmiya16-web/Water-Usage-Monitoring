package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.BillingCycle;
import com.watermonitoring.repository.BillingCycleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing-cycles")
public class BillingCycleController {

    private final BillingCycleRepository cycleRepository;

    @Autowired
    public BillingCycleController(BillingCycleRepository cycleRepository) {
        this.cycleRepository = cycleRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BillingCycle>>> getAllCycles() {
        List<BillingCycle> cycles = cycleRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Billing cycles retrieved successfully", cycles));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<BillingCycle>> getActiveCycle() {
        return cycleRepository.findByStatus("OPEN")
                .map(c -> ResponseEntity.ok(ApiResponse.success("Active billing cycle retrieved", c)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("No active billing cycle found", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BillingCycle>> createCycle(@RequestBody BillingCycle cycle) {
        BillingCycle saved = cycleRepository.save(cycle);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Billing cycle created successfully", saved));
    }
}
