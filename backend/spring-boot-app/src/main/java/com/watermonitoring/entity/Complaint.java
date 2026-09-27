package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "complaint_id")
    private Long complaintId;

    @Column(name = "ticket_ref", nullable = false, unique = true, length = 50)
    private String ticketRef;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "status", length = 20)
    private String status = "OPEN";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Complaint() {}

    public Complaint(String ticketRef, Long userId, String category, String message, String status) {
        this.ticketRef = ticketRef;
        this.userId = userId;
        this.category = category;
        this.message = message;
        this.status = status != null ? status : "OPEN";
        this.createdAt = LocalDateTime.now();
    }

    public Long getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(Long complaintId) {
        this.complaintId = complaintId;
    }

    public String getTicketRef() {
        return ticketRef;
    }

    public void setTicketRef(String ticketRef) {
        this.ticketRef = ticketRef;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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
}
