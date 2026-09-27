package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.resident.ResidentDto;
import com.watermonitoring.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    private final ResidentService residentService;

    @Autowired
    public ResidentController(ResidentService residentService) {
        this.residentService = residentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResidentDto>>> getAllResidents() {
        List<ResidentDto> residents = residentService.getAllResidents();
        return ResponseEntity.ok(ApiResponse.success("Residents retrieved successfully", residents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResidentDto>> getResidentById(@PathVariable Long id) {
        ResidentDto resident = residentService.getResidentById(id);
        return ResponseEntity.ok(ApiResponse.success("Resident retrieved successfully", resident));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ResidentDto>> createResident(@Valid @RequestBody ResidentDto residentDto) {
        ResidentDto created = residentService.createResident(residentDto);
        String msg;
        if (Boolean.FALSE.equals(created.getSendEmail())) {
            msg = "Resident added successfully. No email was sent.";
        } else if (Boolean.TRUE.equals(created.getEmailSent())) {
            msg = "Resident added successfully. Resident information sent to the official Admin email.";
        } else {
            msg = "Resident added successfully, but the email could not be sent to the official Admin email.";
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(msg, created));
    }

    @GetMapping("/building/{buildingName}")
    public ResponseEntity<ApiResponse<List<ResidentDto>>> getResidentsByBuilding(@PathVariable String buildingName) {
        List<ResidentDto> residents = residentService.getResidentsByBuilding(buildingName);
        return ResponseEntity.ok(ApiResponse.success("Residents retrieved for " + buildingName, residents));
    }
}
