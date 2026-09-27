package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @Column(name = "alert_ref", nullable = false, unique = true, length = 50)
    private String alertRef;

    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "alert_type", nullable = false, length = 50)
    private String alertType; // HIGH_BILL, HIGH_CONSUMPTION, POTENTIAL_LEAK, SYSTEM_NOTICE

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "current_value")
    private Double currentValue;

    @Column(name = "expected_value")
    private Double expectedValue;

    @Column(name = "threshold_value")
    private Double thresholdValue;

    @Column(name = "difference_value")
    private Double differenceValue;

    @Column(name = "severity", length = 20)
    private String severity = "WARNING"; // CRITICAL, WARNING, INFO, SUCCESS

    @Column(name = "status", length = 20)
    private String status = "ACTIVE"; // ACTIVE, RESOLVED

    @Column(name = "acknowledged")
    private Boolean acknowledged = false;

    @Column(name = "bill_id")
    private Long billId;

    @Column(name = "usage_id")
    private Long usageId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Alert() {}

    public Alert(String alertRef, Long apartmentId, Long userId, String alertType, String title,
                 String message, Double currentValue, Double expectedValue, Double thresholdValue,
                 Double differenceValue, String severity, String status, Boolean acknowledged,
                 Long billId, Long usageId) {
        this.alertRef = alertRef;
        this.apartmentId = apartmentId;
        this.userId = userId;
        this.alertType = alertType;
        this.title = title;
        this.message = message;
        this.currentValue = currentValue;
        this.expectedValue = expectedValue;
        this.thresholdValue = thresholdValue;
        this.differenceValue = differenceValue;
        this.severity = severity != null ? severity : "WARNING";
        this.status = status != null ? status : "ACTIVE";
        this.acknowledged = acknowledged != null ? acknowledged : false;
        this.billId = billId;
        this.usageId = usageId;
        this.createdAt = LocalDateTime.now();
    }

    public Long getAlertId() {
        return alertId;
    }

    public void setAlertId(Long alertId) {
        this.alertId = alertId;
    }

    public String getAlertRef() {
        return alertRef;
    }

    public void setAlertRef(String alertRef) {
        this.alertRef = alertRef;
    }

    public Long getApartmentId() {
        return apartmentId;
    }

    public void setApartmentId(Long apartmentId) {
        this.apartmentId = apartmentId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Double getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(Double currentValue) {
        this.currentValue = currentValue;
    }

    public Double getExpectedValue() {
        return expectedValue;
    }

    public void setExpectedValue(Double expectedValue) {
        this.expectedValue = expectedValue;
    }

    public Double getThresholdValue() {
        return thresholdValue;
    }

    public void setThresholdValue(Double thresholdValue) {
        this.thresholdValue = thresholdValue;
    }

    public Double getDifferenceValue() {
        return differenceValue;
    }

    public void setDifferenceValue(Double differenceValue) {
        this.differenceValue = differenceValue;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(Boolean acknowledged) {
        this.acknowledged = acknowledged;
    }

    public Long getBillId() {
        return billId;
    }

    public void setBillId(Long billId) {
        this.billId = billId;
    }

    public Long getUsageId() {
        return usageId;
    }

    public void setUsageId(Long usageId) {
        this.usageId = usageId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
