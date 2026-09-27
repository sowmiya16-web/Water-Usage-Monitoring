package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.Complaint;
import com.watermonitoring.entity.MaintenanceRequest;
import com.watermonitoring.entity.User;
import com.watermonitoring.repository.ComplaintRepository;
import com.watermonitoring.repository.MaintenanceRequestRepository;
import com.watermonitoring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceRequestRepository maintenanceRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    @Autowired
    public MaintenanceController(MaintenanceRequestRepository maintenanceRepository,
                                 ComplaintRepository complaintRepository,
                                 UserRepository userRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<MaintenanceRequest>>> getAllRequests() {
        List<MaintenanceRequest> requests = maintenanceRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Maintenance requests retrieved", requests));
    }

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<MaintenanceRequest>> createRequest(@RequestBody MaintenanceRequest request) {
        if (request.getTaskNumber() == null || request.getTaskNumber().isBlank()) {
            request.setTaskNumber("MAIN-" + System.currentTimeMillis() % 100000);
        }
        MaintenanceRequest saved = maintenanceRepository.save(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Maintenance request logged", saved));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<ApiResponse<MaintenanceRequest>> updateRequestStatus(@PathVariable Long id, @RequestParam String status) {
        return maintenanceRepository.findById(id).map(req -> {
            req.setStatus(status);
            MaintenanceRequest updated = maintenanceRepository.save(req);
            return ResponseEntity.ok(ApiResponse.success("Status updated", updated));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Request not found", null)));
    }

    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<List<Complaint>>> getAllComplaints() {
        List<Complaint> complaints = complaintRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Complaints retrieved", complaints));
    }

    @PostMapping("/complaints")
    public ResponseEntity<ApiResponse<Complaint>> createComplaint(@RequestBody Complaint complaint, Authentication auth) {
        if (complaint.getTicketRef() == null || complaint.getTicketRef().isBlank()) {
            complaint.setTicketRef("TKT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        }
        if (complaint.getUserId() == null || complaint.getUserId() == 0L) {
            String email = auth != null ? auth.getName() : null;
            if (email != null) {
                userRepository.findByEmail(email).ifPresent(u -> complaint.setUserId(u.getUserId()));
            }
            if (complaint.getUserId() == null || complaint.getUserId() == 0L) {
                userRepository.findAll().stream().findFirst().ifPresent(u -> complaint.setUserId(u.getUserId()));
            }
        }
        if (complaint.getStatus() == null || complaint.getStatus().isBlank()) {
            complaint.setStatus("OPEN");
        }
        Complaint saved = complaintRepository.save(complaint);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Complaint submitted successfully", saved));
    }
}
