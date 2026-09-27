package com.watermonitoring.controller;
import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.ApartmentDto;
import com.watermonitoring.service.ApartmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {
    private final ApartmentService apartmentService;
    @Autowired
    public ApartmentController(ApartmentService apartmentService) {
        this.apartmentService = apartmentService;
    }
    @GetMapping
    public ResponseEntity<ApiResponse<List<ApartmentDto>>> getAllApartments() {
        List<ApartmentDto> apartments = apartmentService.getAllApartments();
        return ResponseEntity.ok(ApiResponse.success("Apartments retrieved successfully", apartments));
    }
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApartmentDto>> getApartmentById(@PathVariable Long id) {
        ApartmentDto apartment = apartmentService.getApartmentById(id);
        return ResponseEntity.ok(ApiResponse.success("Apartment retrieved successfully", apartment));
    }
    @PostMapping
    public ResponseEntity<ApiResponse<ApartmentDto>> createApartment(@Valid @RequestBody ApartmentDto apartmentDto) {
        ApartmentDto created = apartmentService.createApartment(apartmentDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Apartment created successfully", created));
    }
    @GetMapping("/building/{buildingName}")
    public ResponseEntity<ApiResponse<List<ApartmentDto>>> getApartmentsByBuilding(@PathVariable String buildingName) {
        List<ApartmentDto> apartments = apartmentService.getApartmentsByBuilding(buildingName);
        return ResponseEntity.ok(ApiResponse.success("Apartments retrieved for " + buildingName, apartments));
    }
}