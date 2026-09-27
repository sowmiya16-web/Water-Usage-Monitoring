package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.BulkWaterPurchase;
import com.watermonitoring.entity.TariffPlan;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.service.CommunityAdminService;
import com.watermonitoring.service.CommunityAdminService.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

/**
 * Community Admin API. Everything under /api/community-admin/** is restricted
 * in SecurityConfig to the community-admin / admin roles.
 */
@RestController
@RequestMapping("/api/community-admin")
public class CommunityAdminController {

    private final CommunityAdminService service;

    @Autowired
    public CommunityAdminController(CommunityAdminService service) {
        this.service = service;
    }

    public record ReadingRequest(LocalDate readingDate, Double currentReading, Double previousReading) {}
    public record CycleRequest(String name, LocalDate startDate, LocalDate endDate) {}

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Dashboard>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success("Community dashboard", service.dashboard()));
    }

    @GetMapping("/households/usage")
    public ResponseEntity<ApiResponse<HouseholdComparison>> householdUsage(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.success("Household usage comparison", service.householdComparison(month)));
    }

    /* ---- meters & readings ---- */

    @GetMapping("/meters")
    public ResponseEntity<ApiResponse<List<MeterRow>>> meters() {
        return ResponseEntity.ok(ApiResponse.success("Meters", service.meters()));
    }

    @GetMapping("/readings")
    public ResponseEntity<ApiResponse<List<ReadingRow>>> readings(@RequestParam(required = false) Long meterId,
                                                                  @RequestParam(defaultValue = "25") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Recent readings", service.recentReadings(meterId, limit)));
    }

    @PostMapping("/meters/{meterId}/readings")
    public ResponseEntity<ApiResponse<ReadingRow>> addReading(@PathVariable Long meterId, @RequestBody ReadingRequest req) {
        ReadingRow row = service.addReading(meterId, req.readingDate(), req.currentReading(), req.previousReading());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Reading recorded", row));
    }

    @PostMapping(value = "/readings/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CsvResult>> uploadReadings(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new BadRequestException("Please choose a non-empty CSV file.");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!name.endsWith(".csv")) throw new BadRequestException("Only .csv files are accepted.");
        CsvResult result = service.importReadingsCsv(file.getInputStream());
        return ResponseEntity.ok(ApiResponse.success(
                "Imported " + result.imported() + " of " + result.rows() + " rows" + (result.errors().isEmpty() ? "." : " (" + result.errors().size() + " rejected)."), result));
    }

    /* ---- billing cycles ---- */

    @GetMapping("/cycles")
    public ResponseEntity<ApiResponse<List<CycleRow>>> cycles() {
        return ResponseEntity.ok(ApiResponse.success("Billing cycles", service.cycles()));
    }

    @PostMapping("/cycles")
    public ResponseEntity<ApiResponse<CycleRow>> createCycle(@RequestBody CycleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Billing cycle created", service.createCycle(req.name(), req.startDate(), req.endDate())));
    }

    @PostMapping("/cycles/{id}/close")
    public ResponseEntity<ApiResponse<CycleRow>> closeCycle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Billing cycle closed", service.closeCycle(id)));
    }

    /* ---- tariffs ---- */

    @GetMapping("/tariffs")
    public ResponseEntity<ApiResponse<TariffView>> tariffs(@RequestParam(required = false) Integer buildingId) {
        return ResponseEntity.ok(ApiResponse.success("Tariff versions", service.tariffs(buildingId)));
    }

    @PostMapping("/tariffs")
    public ResponseEntity<ApiResponse<TariffPlan>> createTariff(@RequestBody TariffPlan body) {
        TariffPlan saved = service.createTariffVersion(body);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tariff saved as version " + saved.getVersion() + " — previous versions are preserved", saved));
    }

    /* ---- bulk purchases ---- */

    @GetMapping("/bulk-purchases")
    public ResponseEntity<ApiResponse<PurchaseHistory>> purchases() {
        return ResponseEntity.ok(ApiResponse.success("Bulk water purchases", service.purchases()));
    }

    @PostMapping("/bulk-purchases")
    public ResponseEntity<ApiResponse<BulkWaterPurchase>> recordPurchase(@RequestBody BulkWaterPurchase body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulk water purchase recorded", service.recordPurchase(body)));
    }
}
