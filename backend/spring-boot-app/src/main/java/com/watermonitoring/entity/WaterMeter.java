package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_meter", indexes = @Index(name = "idx_meter_apartment", columnList = "apartment_id"))
public class WaterMeter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meter_id")
    private Long meterId;

    @Column(name = "serial_number", nullable = false, unique = true, length = 50)
    private String serialNumber;

    @Column(name = "apartment_id", nullable = false)
    private Long apartmentId;

    @Column(name = "battery_percentage")
    private Integer batteryPercentage = 100;

    @Column(name = "signal_strength")
    private Integer signalStrength = 100;

    @Column(name = "status", length = 20)
    private String status = "ONLINE";

    @Column(name = "last_ping_at")
    private LocalDateTime lastPingAt = LocalDateTime.now();

    public WaterMeter() {}

    public WaterMeter(String serialNumber, Long apartmentId, Integer batteryPercentage, Integer signalStrength, String status) {
        this.serialNumber = serialNumber;
        this.apartmentId = apartmentId;
        this.batteryPercentage = batteryPercentage != null ? batteryPercentage : 100;
        this.signalStrength = signalStrength != null ? signalStrength : 100;
        this.status = status != null ? status : "ONLINE";
        this.lastPingAt = LocalDateTime.now();
    }

    public Long getMeterId() {
        return meterId;
    }

    public void setMeterId(Long meterId) {
        this.meterId = meterId;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public Long getApartmentId() {
        return apartmentId;
    }

    public void setApartmentId(Long apartmentId) {
        this.apartmentId = apartmentId;
    }

    public Integer getBatteryPercentage() {
        return batteryPercentage;
    }

    public void setBatteryPercentage(Integer batteryPercentage) {
        this.batteryPercentage = batteryPercentage;
    }

    public Integer getSignalStrength() {
        return signalStrength;
    }

    public void setSignalStrength(Integer signalStrength) {
        this.signalStrength = signalStrength;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastPingAt() {
        return lastPingAt;
    }

    public void setLastPingAt(LocalDateTime lastPingAt) {
        this.lastPingAt = lastPingAt;
    }
}
