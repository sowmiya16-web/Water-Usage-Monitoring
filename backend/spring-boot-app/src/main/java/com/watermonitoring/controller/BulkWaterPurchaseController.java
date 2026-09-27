package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.BulkWaterPurchase;
import com.watermonitoring.repository.BulkWaterPurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bulk-purchases")
public class BulkWaterPurchaseController {

    private final BulkWaterPurchaseRepository purchaseRepository;

    @Autowired
    public BulkWaterPurchaseController(BulkWaterPurchaseRepository purchaseRepository) {
        this.purchaseRepository = purchaseRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BulkWaterPurchase>>> getAllPurchases() {
        List<BulkWaterPurchase> purchases = purchaseRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Bulk water purchases retrieved successfully", purchases));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BulkWaterPurchase>> recordPurchase(@RequestBody BulkWaterPurchase purchase) {
        BulkWaterPurchase saved = purchaseRepository.save(purchase);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulk water purchase recorded successfully", saved));
    }
}
