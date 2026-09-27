package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.building.BuildingDto;
import com.watermonitoring.service.BuildingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    @Autowired
    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuildingDto>>> getAllBuildings() {
        List<BuildingDto> buildings = buildingService.getAllBuildings();
        return ResponseEntity.ok(ApiResponse.success("Buildings retrieved successfully", buildings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuildingDto>> getBuildingById(@PathVariable Integer id) {
        BuildingDto building = buildingService.getBuildingById(id);
        return ResponseEntity.ok(ApiResponse.success("Building retrieved successfully", building));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BuildingDto>> createBuilding(@Valid @RequestBody BuildingDto buildingDto) {
        BuildingDto created = buildingService.createBuilding(buildingDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Building created successfully", created));
    }
}
