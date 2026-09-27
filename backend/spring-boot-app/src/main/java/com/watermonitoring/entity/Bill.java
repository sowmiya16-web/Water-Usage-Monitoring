package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bill_id")
    private Long billId;

    @Column(name = "bill_number", nullable = false, unique = true, length = 50)
    private String billNumber;

    @Column(name = "apartment_id", nullable = false)
    private Long apartmentId;

    @Column(name = "billing_month", nullable = false, length = 20)
    private String billingMonth;

    @Column(name = "consumption_kl", nullable = false)
    private Double consumptionKl;

    @Column(name = "volumetric_amount", nullable = false)
    private Double volumetricAmount;

    @Column(name = "base_charge", nullable = false)
    private Double baseCharge;

    @Column(name = "common_water_charge", nullable = false)
    private Double commonWaterCharge;

    @Column(name = "gst_amount", nullable = false)
    private Double gstAmount;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    // "PENDING", "PAID", or "SUPERSEDED" (recalculated due to a tariff
    // change — the old amounts are kept here for audit; supersededByBillId
    // points at the new bill row that replaced it. Bills are never
    // overwritten in place — a recalculation always inserts a new row.)
    @Column(name = "status", length = 20)
    private String status = "PENDING";

    @Column(name = "superseded_by_bill_id")
    private Long supersededByBillId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Bill() {}

    public Bill(String billNumber, Long apartmentId, String billingMonth, Double consumptionKl,
                Double volumetricAmount, Double baseCharge, Double commonWaterCharge,
                Double gstAmount, Double totalAmount, LocalDate dueDate, String status) {
        this.billNumber = billNumber;
        this.apartmentId = apartmentId;
        this.billingMonth = billingMonth;
        this.consumptionKl = consumptionKl;
        this.volumetricAmount = volumetricAmount;
        this.baseCharge = baseCharge;
        this.commonWaterCharge = commonWaterCharge;
        this.gstAmount = gstAmount;
        this.totalAmount = totalAmount;
        this.dueDate = dueDate;
        this.status = status != null ? status : "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public Long getBillId() {
        return billId;
    }

    public void setBillId(Long billId) {
        this.billId = billId;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
    }

    public Long getApartmentId() {
        return apartmentId;
    }

    public void setApartmentId(Long apartmentId) {
        this.apartmentId = apartmentId;
    }

    public String getBillingMonth() {
        return billingMonth;
    }

    public void setBillingMonth(String billingMonth) {
        this.billingMonth = billingMonth;
    }

    public Double getConsumptionKl() {
        return consumptionKl;
    }

    public void setConsumptionKl(Double consumptionKl) {
        this.consumptionKl = consumptionKl;
    }

    public Double getVolumetricAmount() {
        return volumetricAmount;
    }

    public void setVolumetricAmount(Double volumetricAmount) {
        this.volumetricAmount = volumetricAmount;
    }

    public Double getBaseCharge() {
        return baseCharge;
    }

    public void setBaseCharge(Double baseCharge) {
        this.baseCharge = baseCharge;
    }

    public Double getCommonWaterCharge() {
        return commonWaterCharge;
    }

    public void setCommonWaterCharge(Double commonWaterCharge) {
        this.commonWaterCharge = commonWaterCharge;
    }

    public Double getGstAmount() {
        return gstAmount;
    }

    public void setGstAmount(Double gstAmount) {
        this.gstAmount = gstAmount;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getSupersededByBillId() {
        return supersededByBillId;
    }

    public void setSupersededByBillId(Long supersededByBillId) {
        this.supersededByBillId = supersededByBillId;
    }
}
