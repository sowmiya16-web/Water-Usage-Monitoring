package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_cycle")
public class BillingCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cycle_id")
    private Long cycleId;

    @Column(name = "cycle_name", nullable = false, length = 50)
    private String cycleName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "status", length = 20)
    private String status = "OPEN";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public BillingCycle() {}

    public BillingCycle(String cycleName, LocalDate startDate, LocalDate endDate, String status) {
        this.cycleName = cycleName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status != null ? status : "OPEN";
    }

    public Long getCycleId() { return cycleId; }
    public void setCycleId(Long cycleId) { this.cycleId = cycleId; }

    public String getCycleName() { return cycleName; }
    public void setCycleName(String cycleName) { this.cycleName = cycleName; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
