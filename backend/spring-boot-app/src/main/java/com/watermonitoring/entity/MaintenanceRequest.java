package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_request")
public class MaintenanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "task_number", nullable = false, unique = true, length = 50)
    private String taskNumber;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "location", nullable = false, length = 100)
    private String location;

    @Column(name = "assigned_to", length = 100)
    private String assignedTo;

    @Column(name = "priority", length = 20)
    private String priority = "ROUTINE";

    @Column(name = "status", length = 20)
    private String status = "OPEN";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public MaintenanceRequest() {}

    public MaintenanceRequest(String taskNumber, String title, String location, String assignedTo, String priority, String status) {
        this.taskNumber = taskNumber;
        this.title = title;
        this.location = location;
        this.assignedTo = assignedTo;
        this.priority = priority != null ? priority : "ROUTINE";
        this.status = status != null ? status : "OPEN";
        this.createdAt = LocalDateTime.now();
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getTaskNumber() {
        return taskNumber;
    }

    public void setTaskNumber(String taskNumber) {
        this.taskNumber = taskNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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
