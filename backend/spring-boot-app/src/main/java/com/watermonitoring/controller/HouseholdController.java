package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.service.HouseholdService;
import com.watermonitoring.service.HouseholdService.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Household management for the Community Admin dashboards. Covered by the
 * /api/community-admin/** rule in SecurityConfig (community-admin / admin roles only).
 */
@RestController
@RequestMapping("/api/community-admin/households")
public class HouseholdController {

    private final HouseholdService service;

    @Autowired
    public HouseholdController(HouseholdService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<HouseholdList>> list(@RequestParam(required = false) String month,
                                                           @RequestParam(required = false) String q,
                                                           @RequestParam(required = false) String building,
                                                           @RequestParam(required = false) String status,
                                                           @RequestParam(defaultValue = "usage") String sort,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success("Households", service.list(month, q, building, status, sort, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseholdDetail>> detail(@PathVariable Long id,
                                                               @RequestParam(defaultValue = "12") int months) {
        return ResponseEntity.ok(ApiResponse.success("Household detail", service.detail(id, months)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HouseholdDetail>> create(@RequestBody HouseholdRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Household added", service.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseholdDetail>> update(@PathVariable Long id, @RequestBody HouseholdRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Household updated", service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteResult>> delete(@PathVariable Long id) {
        DeleteResult r = service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Household " + r.household() + " deleted", r));
    }

    @PostMapping("/{id}/residents")
    public ResponseEntity<ApiResponse<ResidentAdded>> addResident(@PathVariable Long id, @RequestBody ResidentRequest req) {
        ResidentAdded added = service.addResident(id, req);
        String msg = added.linkedExisting()
                ? "Resident added. Their existing portal account is now linked to this household."
                : added.loginCreated()
                ? (Boolean.TRUE.equals(added.emailSent()) ? "Resident added and a portal login was created. Welcome email sent."
                : "Resident added and a portal login was created.")
                : "Resident added to the household.";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg, added));
    }

    @PutMapping("/{id}/residents/{residentId}")
    public ResponseEntity<ApiResponse<ResidentRow>> updateResident(@PathVariable Long id, @PathVariable Long residentId,
                                                                   @RequestBody ResidentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Resident updated", service.updateResident(id, residentId, req)));
    }

    @DeleteMapping("/{id}/residents/{residentId}")
    public ResponseEntity<ApiResponse<Void>> deleteResident(@PathVariable Long id, @PathVariable Long residentId) {
        service.deleteResident(id, residentId);
        return ResponseEntity.ok(ApiResponse.success("Resident removed", null));
    }
}
