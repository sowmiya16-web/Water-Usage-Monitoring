package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resident", indexes = {
        @Index(name = "idx_resident_apartment", columnList = "apartment_id"),
        @Index(name = "idx_resident_unit", columnList = "apartment_number, building_name")
})
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resident_id")
    private Long residentId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "apartment_number", nullable = false, length = 20)
    private String apartmentNumber;

    @Column(name = "building_name", nullable = false, length = 100)
    private String buildingName;

    @Column(name = "occupancy_status", length = 20)
    private String occupancyStatus = "OCCUPIED";

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "registered_date", updatable = false)
    private LocalDateTime registeredDate = LocalDateTime.now();

    public Resident() {}

    public Resident(String fullName, String email, String phone, String apartmentNumber, String buildingName, String occupancyStatus) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.apartmentNumber = apartmentNumber;
        this.buildingName = buildingName;
        this.occupancyStatus = occupancyStatus != null ? occupancyStatus : "OCCUPIED";
        this.registeredDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }

    public Long getApartmentId() { return apartmentId; }
    public void setApartmentId(Long apartmentId) { this.apartmentId = apartmentId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getApartmentNumber() { return apartmentNumber; }
    public void setApartmentNumber(String apartmentNumber) { this.apartmentNumber = apartmentNumber; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public String getOccupancyStatus() { return occupancyStatus; }
    public void setOccupancyStatus(String occupancyStatus) { this.occupancyStatus = occupancyStatus; }

    public LocalDateTime getRegisteredDate() { return registeredDate; }
    public void setRegisteredDate(LocalDateTime registeredDate) { this.registeredDate = registeredDate; }
}
