package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_usage", indexes = {
        @Index(name = "idx_usage_meter_date", columnList = "meter_id, reading_date"),
        @Index(name = "idx_usage_date", columnList = "reading_date")
})
public class WaterUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usage_id")
    private Long usageId;

    @Column(name = "meter_id", nullable = false)
    private Long meterId;

    @Column(name = "previous_reading", nullable = false)
    private Double previousReading;

    @Column(name = "current_reading", nullable = false)
    private Double currentReading;

    @Column(name = "consumption_kl", nullable = false)
    private Double consumptionKl;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt = LocalDateTime.now();

    public WaterUsage() {}

    public WaterUsage(Long meterId, Double previousReading, Double currentReading, Double consumptionKl, LocalDate readingDate) {
        this.meterId = meterId;
        this.previousReading = previousReading;
        this.currentReading = currentReading;
        this.consumptionKl = consumptionKl;
        this.readingDate = readingDate != null ? readingDate : LocalDate.now();
        this.recordedAt = LocalDateTime.now();
    }

    public Long getUsageId() {
        return usageId;
    }

    public void setUsageId(Long usageId) {
        this.usageId = usageId;
    }

    public Long getMeterId() {
        return meterId;
    }

    public void setMeterId(Long meterId) {
        this.meterId = meterId;
    }

    public Double getPreviousReading() {
        return previousReading;
    }

    public void setPreviousReading(Double previousReading) {
        this.previousReading = previousReading;
    }

    public Double getCurrentReading() {
        return currentReading;
    }

    public void setCurrentReading(Double currentReading) {
        this.currentReading = currentReading;
    }

    public Double getConsumptionKl() {
        return consumptionKl;
    }

    public void setConsumptionKl(Double consumptionKl) {
        this.consumptionKl = consumptionKl;
    }

    public LocalDate getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDate readingDate) {
        this.readingDate = readingDate;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
