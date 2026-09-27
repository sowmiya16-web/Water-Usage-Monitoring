package com.watermonitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ApartmentDto {
    private Long apartmentId;
    @NotBlank(message = "Apartment number is required")
    private String apartmentNumber;

    @NotBlank(message = "Building name is required")
    private String buildingName;
    @NotNull(message = "Floor number is required")
    private Integer floorNumber;
    private String occupancyStatus;

    public ApartmentDto() {}
    public ApartmentDto(Long apartmentId, String apartmentNumber, String buildingName, Integer floorNumber, String occupancyStatus) {
        this.apartmentId = apartmentId;
        this.apartmentNumber = apartmentNumber;
        this.buildingName = buildingName;
        this.floorNumber = floorNumber;
        this.occupancyStatus = occupancyStatus;
    }
    public Long getApartmentId() {
        return apartmentId;
    }
    public void setApartmentId(Long apartmentId) {
        this.apartmentId = apartmentId;
    }
    public String getApartmentNumber() {
        return apartmentNumber;
    }
    public void setApartmentNumber(String apartmentNumber) {
        this.apartmentNumber = apartmentNumber;
    }
    public String getBuildingName() {
        return buildingName;
    }
    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }
    public Integer getFloorNumber() {
        return floorNumber;
    }
    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }
    public String getOccupancyStatus() {
        return occupancyStatus;
    }
    public void setOccupancyStatus(String occupancyStatus) {
        this.occupancyStatus = occupancyStatus;
    }
}
