package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.TariffPlan;
import com.watermonitoring.repository.TariffPlanRepository;
import com.watermonitoring.service.AlertEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tariffs")
public class TariffController {

    private final TariffPlanRepository tariffRepository;
    private final AlertEngineService alertEngineService;

    @Autowired
    public TariffController(TariffPlanRepository tariffRepository,
                            AlertEngineService alertEngineService) {
        this.tariffRepository = tariffRepository;
        this.alertEngineService = alertEngineService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TariffPlan>>> getAllTariffs() {
        List<TariffPlan> tariffs = tariffRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Tariff plans retrieved successfully", tariffs));
    }

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<ApiResponse<TariffPlan>> getTariffByBuilding(@PathVariable Integer buildingId) {
        return tariffRepository.findByBuildingId(buildingId)
                .map(t -> ResponseEntity.ok(ApiResponse.success("Tariff plan retrieved", t)))
                .orElse(ResponseEntity.ok(ApiResponse.success("Default tariff applied", new TariffPlan("Tiered Standard Plan", buildingId, 10.0, 5.0, 20.0, 15.0, 25.0, 150.0, 100.0))));
    }

    /**
     * Full, timestamped version history for a building's tariff — every
     * past rate change, newest first, since changes are never overwritten.
     */
    @GetMapping("/building/{buildingId}/history")
    public ResponseEntity<ApiResponse<List<TariffPlan>>> getTariffHistory(@PathVariable Integer buildingId) {
        List<TariffPlan> history = tariffRepository.findByBuildingIdOrderByPlanIdDesc(buildingId);
        return ResponseEntity.ok(ApiResponse.success("Tariff version history retrieved", history));
    }

    /**
     * Saves a tariff change. This NEVER overwrites the previous tariff —
     * it always inserts a new, timestamped version row, preserving every
     * past rate exactly as it was (see the /history endpoint).
     *
     * Bill recalculation against the new rate is a separate, explicit
     * step: the Tariff Management page's "save" action immediately
     * follows this call with POST /api/bills/generate-monthly, which
     * recalculates every affected PENDING bill one apartment at a time
     * (see BillSchedulerService) and pushes the change into each
     * resident's Billing History.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TariffPlan>> createOrUpdateTariff(@RequestBody TariffPlan tariffPlan) {

        if (tariffPlan.getBuildingId() == null) {
            tariffPlan.setBuildingId(1);
        }

        int nextVersion = tariffRepository.findByBuildingId(tariffPlan.getBuildingId())
                .map(existing -> existing.getVersion() + 1)
                .orElse(1);

        // Force an INSERT — never reuse an existing row's primary key, so
        // the previous version is preserved exactly as it was.
        tariffPlan.setPlanId(null);
        tariffPlan.setVersion(nextVersion);
        tariffPlan.setEffectiveFrom(LocalDateTime.now());

        TariffPlan saved = tariffRepository.save(tariffPlan);

        try {
            int generatedAlerts = alertEngineService.evaluateAllAlertConditions();
            System.out.println("[TariffController] Saved tariff v" + nextVersion + " for building "
                    + saved.getBuildingId() + ". Generated " + generatedAlerts + " dynamic alerts.");
        } catch (Exception e) {
            System.err.println("Warning: Alert evaluation after tariff save failed: " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tariff plan saved as version " + nextVersion, saved));
    }
}
