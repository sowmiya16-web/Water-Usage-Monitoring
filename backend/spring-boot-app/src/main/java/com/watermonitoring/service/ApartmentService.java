package com.watermonitoring.service;

import com.watermonitoring.dto.ApartmentDto;
import com.watermonitoring.entity.Apartment;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.ApartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;

    @Autowired
    public ApartmentService(ApartmentRepository apartmentRepository) {
        this.apartmentRepository = apartmentRepository;
    }

    public List<ApartmentDto> getAllApartments() {
        return apartmentRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ApartmentDto getApartmentById(Long id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + id));
        return mapToDto(apartment);
    }

    public ApartmentDto createApartment(ApartmentDto dto) {
        if (apartmentRepository.existsByApartmentNumberAndBuildingName(dto.getApartmentNumber(), dto.getBuildingName())) {
            throw new BadRequestException("Apartment " + dto.getApartmentNumber() + " already exists in " + dto.getBuildingName());
        }

        Apartment apartment = new Apartment(
                dto.getApartmentNumber(),
                dto.getBuildingName(),
                dto.getFloorNumber(),
                dto.getOccupancyStatus()
        );

        Apartment saved = apartmentRepository.save(apartment);
        return mapToDto(saved);
    }

    public List<ApartmentDto> getApartmentsByBuilding(String buildingName) {
        return apartmentRepository.findByBuildingName(buildingName)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ApartmentDto mapToDto(Apartment apartment) {
        return new ApartmentDto(
                apartment.getApartmentId(),
                apartment.getApartmentNumber(),
                apartment.getBuildingName(),
                apartment.getFloorNumber(),
                apartment.getOccupancyStatus()
        );
    }
}
