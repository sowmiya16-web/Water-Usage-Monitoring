package com.watermonitoring.service;

import com.watermonitoring.dto.building.BuildingDto;
import com.watermonitoring.entity.Building;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.BuildingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BuildingService {

    private final BuildingRepository buildingRepository;

    @Autowired
    public BuildingService(BuildingRepository buildingRepository) {
        this.buildingRepository = buildingRepository;
    }

    public List<BuildingDto> getAllBuildings() {
        return buildingRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public BuildingDto getBuildingById(Integer id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + id));
        return mapToDto(building);
    }

    public BuildingDto createBuilding(BuildingDto dto) {
        if (buildingRepository.existsByBuildingName(dto.getBuildingName())) {
            throw new BadRequestException("Building " + dto.getBuildingName() + " already exists");
        }

        Building building = new Building(
                dto.getBuildingName(),
                dto.getTotalFloors(),
                dto.getTotalUnits()
        );

        Building saved = buildingRepository.save(building);
        return mapToDto(saved);
    }

    private BuildingDto mapToDto(Building building) {
        return new BuildingDto(
                building.getBuildingId(),
                building.getBuildingName(),
                building.getTotalFloors(),
                building.getTotalUnits()
        );
    }
}
