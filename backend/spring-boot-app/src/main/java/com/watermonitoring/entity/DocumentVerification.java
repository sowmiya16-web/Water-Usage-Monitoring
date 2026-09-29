package com.watermonitoring.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * DocumentVerification — one resident-uploaded document (ID proof, address proof, etc.)
 * and its review lifecycle: PENDING -> UNDER_REVIEW -> VERIFIED or REJECTED.
 */
@Entity
@Table(name = "document_verification", indexes = {
        @Index(name = "idx_docver_apartment", columnList = "apartment_id"),
        @Index(name = "idx_docver_status", columnList = "status")
})
public class DocumentVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "apartment_id", nullable = false)
    private Long apartmentId;

    @Column(name = "uploader_email", nullable = false, length = 150)
    private String uploaderEmail;

    @Column(name = "uploader_name", length = 150)
    private String uploaderName;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    // Length forces MySQL to size this as LONGBLOB instead of the 255-byte-default TINYBLOB
    // (the same fix Invoice.pdfData needed) — a scanned ID/PDF is far bigger than that.
    @Lob
    @JdbcTypeCode(SqlTypes.BLOB)
    @Column(name = "file_data", nullable = false, length = 33_554_432)
    private byte[] fileData;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "reviewed_by_email", length = 150)
    private String reviewedByEmail;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public DocumentVerification() {}

    public DocumentVerification(Long apartmentId, String uploaderEmail, String uploaderName, String documentType,
                                String fileName, String contentType, Long fileSize, byte[] fileData) {
        this.apartmentId = apartmentId;
        this.uploaderEmail = uploaderEmail;
        this.uploaderName = uploaderName;
        this.documentType = documentType;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.fileData = fileData;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public Long getApartmentId() { return apartmentId; }
    public void setApartmentId(Long apartmentId) { this.apartmentId = apartmentId; }

    public String getUploaderEmail() { return uploaderEmail; }
    public void setUploaderEmail(String uploaderEmail) { this.uploaderEmail = uploaderEmail; }

    public String getUploaderName() { return uploaderName; }
    public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getReviewedByEmail() { return reviewedByEmail; }
    public void setReviewedByEmail(String reviewedByEmail) { this.reviewedByEmail = reviewedByEmail; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
