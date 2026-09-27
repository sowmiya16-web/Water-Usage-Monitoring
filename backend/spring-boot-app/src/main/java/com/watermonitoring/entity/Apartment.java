package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "apartment",
       uniqueConstraints = @UniqueConstraint(name = "uk_apartment_unit", columnNames = {"apartment_number", "building_name"}),
       indexes = @Index(name = "idx_apartment_building", columnList = "building_name"))
public class Apartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "apartment_number", nullable = false, length = 20)
    private String apartmentNumber;

    @Column(name = "building_name", nullable = false, length = 100)
    private String buildingName;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber = 1;

    @Column(name = "occupancy_status", length = 20)
    private String occupancyStatus = "OCCUPIED";

    @Column(name = "resident_user_id")
    private Long residentUserId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Apartment() {}

    public Apartment(String apartmentNumber, String buildingName, Integer floorNumber, String occupancyStatus) {
        this.apartmentNumber = apartmentNumber;
        this.buildingName = buildingName;
        this.floorNumber = floorNumber != null ? floorNumber : 1;
        this.occupancyStatus = occupancyStatus != null ? occupancyStatus : "OCCUPIED";
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
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

    public Long getResidentUserId() {
        return residentUserId;
    }

    public void setResidentUserId(Long residentUserId) {
        this.residentUserId = residentUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
