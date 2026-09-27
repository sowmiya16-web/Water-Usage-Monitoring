package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bulk_water_purchase")
public class BulkWaterPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_id")
    private Long purchaseId;

    @Column(name = "supplier_name", nullable = false, length = 100)
    private String supplierName;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "volume_kl", nullable = false)
    private Double volumeKl;

    @Column(name = "total_cost", nullable = false)
    private Double totalCost;

    @Column(name = "water_source", length = 100)
    private String waterSource;

    @Column(name = "unit_cost")
    private Double unitCost;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "billing_cycle_id")
    private Long billingCycleId = 1L;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public BulkWaterPurchase() {}

    public BulkWaterPurchase(String supplierName, LocalDate deliveryDate, Double volumeKl, Double totalCost, String waterSource, Double unitCost, String notes, Long billingCycleId) {
        this.supplierName = supplierName;
        this.deliveryDate = deliveryDate;
        this.volumeKl = volumeKl;
        this.totalCost = totalCost;
        this.waterSource = waterSource;
        this.unitCost = unitCost;
        this.notes = notes;
        this.billingCycleId = billingCycleId != null ? billingCycleId : 1L;
    }

    public Long getPurchaseId() { return purchaseId; }
    public void setPurchaseId(Long purchaseId) { this.purchaseId = purchaseId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }

    public Double getVolumeKl() { return volumeKl; }
    public void setVolumeKl(Double volumeKl) { this.volumeKl = volumeKl; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public String getWaterSource() { return waterSource; }
    public void setWaterSource(String waterSource) { this.waterSource = waterSource; }

    public Double getUnitCost() { return unitCost; }
    public void setUnitCost(Double unitCost) { this.unitCost = unitCost; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getBillingCycleId() { return billingCycleId; }
    public void setBillingCycleId(Long billingCycleId) { this.billingCycleId = billingCycleId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
