package com.watermonitoring.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * VerificationSettings — a single global row (id is always 1) controlling what the
 * document-verification feature accepts: the list of document types residents can pick
 * from, and the max upload size. Admin-managed; created on first access if missing.
 */
@Entity
@Table(name = "verification_settings")
public class VerificationSettings {

    @Id
    @Column(name = "settings_id")
    private Integer settingsId = 1;

    @Column(name = "document_types", nullable = false, length = 1000)
    private String documentTypes = "ID Proof,Address Proof,Ownership Proof,No Objection Certificate,Other";

    @Column(name = "max_file_size_mb", nullable = false)
    private Integer maxFileSizeMb = 5;

    @Column(name = "instructions", length = 2000)
    private String instructions = "Upload a clear photo or PDF scan of the document. Accepted formats: PDF, JPG, PNG.";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "updated_by_email", length = 150)
    private String updatedByEmail;

    public VerificationSettings() {}

    public Integer getSettingsId() { return settingsId; }
    public void setSettingsId(Integer settingsId) { this.settingsId = settingsId; }

    public String getDocumentTypes() { return documentTypes; }
    public void setDocumentTypes(String documentTypes) { this.documentTypes = documentTypes; }

    public Integer getMaxFileSizeMb() { return maxFileSizeMb; }
    public void setMaxFileSizeMb(Integer maxFileSizeMb) { this.maxFileSizeMb = maxFileSizeMb; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedByEmail() { return updatedByEmail; }
    public void setUpdatedByEmail(String updatedByEmail) { this.updatedByEmail = updatedByEmail; }
}
