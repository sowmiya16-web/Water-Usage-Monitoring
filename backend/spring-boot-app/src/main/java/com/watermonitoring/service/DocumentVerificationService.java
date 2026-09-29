package com.watermonitoring.service;

import com.watermonitoring.entity.Apartment;
import com.watermonitoring.entity.DocumentVerification;
import com.watermonitoring.entity.User;
import com.watermonitoring.entity.VerificationSettings;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.ApartmentRepository;
import com.watermonitoring.repository.DocumentVerificationRepository;
import com.watermonitoring.repository.UserRepository;
import com.watermonitoring.repository.VerificationSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * DocumentVerificationService — resident document upload, the admin review queue, and the
 * verification-wide statistics/settings. All numbers are computed live from the database.
 */
@Service
public class DocumentVerificationService {

    private static final Logger log = LoggerFactory.getLogger(DocumentVerificationService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/jpg", "image/png");

    private final DocumentVerificationRepository documentRepository;
    private final VerificationSettingsRepository settingsRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final ResidentDashboardService dashboardService;
    private final EmailService emailService;

    @Autowired
    public DocumentVerificationService(DocumentVerificationRepository documentRepository,
                                       VerificationSettingsRepository settingsRepository,
                                       ApartmentRepository apartmentRepository,
                                       UserRepository userRepository,
                                       ResidentDashboardService dashboardService,
                                       EmailService emailService) {
        this.documentRepository = documentRepository;
        this.settingsRepository = settingsRepository;
        this.apartmentRepository = apartmentRepository;
        this.userRepository = userRepository;
        this.dashboardService = dashboardService;
        this.emailService = emailService;
    }

    /* =====================  DTOs  ===================== */

    public record DocumentSummary(Long documentId, Long apartmentId, String apartmentNumber, String buildingName,
                                  String uploaderName, String uploaderEmail, String documentType, String fileName,
                                  String contentType, Long fileSize, String status, String rejectionReason,
                                  String reviewedByEmail, String reviewedAt, String uploadedAt) {}

    public record ReviewQueueResult(int total, int pending, int underReview, int verified, int rejected,
                                    int page, int size, int matched, List<DocumentSummary> documents) {}

    public record SettingsView(List<String> documentTypes, int maxFileSizeMb, String instructions, String updatedAt) {}

    public record BuildingStat(String buildingName, int total, int pending, int underReview, int verified, int rejected) {}
    public record TypeStat(String documentType, int total) {}
    public record Stats(int total, int pending, int underReview, int verified, int rejected,
                        double verificationRatePct, List<BuildingStat> byBuilding, List<TypeStat> byType) {}

    /* =====================  Settings  ===================== */

    @Transactional
    public SettingsView getSettings() {
        return toView(getOrCreateSettings());
    }

    @Transactional
    protected VerificationSettings getOrCreateSettings() {
        return settingsRepository.findById(1).orElseGet(() -> settingsRepository.save(new VerificationSettings()));
    }

    @Transactional
    public SettingsView updateSettings(List<String> documentTypes, Integer maxFileSizeMb, String instructions, String adminEmail) {
        if (documentTypes == null || documentTypes.stream().noneMatch(t -> t != null && !t.isBlank()))
            throw new BadRequestException("At least one document type is required.");
        List<String> cleaned = documentTypes.stream().map(String::trim).filter(t -> !t.isEmpty()).distinct().toList();
        if (cleaned.size() > 20) throw new BadRequestException("No more than 20 document types are supported.");
        for (String t : cleaned) if (t.length() > 60) throw new BadRequestException("Document type '" + t + "' is too long (max 60 characters).");
        if (maxFileSizeMb == null || maxFileSizeMb < 1 || maxFileSizeMb > 25)
            throw new BadRequestException("Max file size must be between 1 and 25 MB.");
        if (instructions != null && instructions.length() > 2000) throw new BadRequestException("Instructions must be 2000 characters or fewer.");

        VerificationSettings s = getOrCreateSettings();
        s.setDocumentTypes(String.join(",", cleaned));
        s.setMaxFileSizeMb(maxFileSizeMb);
        s.setInstructions(instructions == null ? "" : instructions.trim());
        s.setUpdatedAt(LocalDateTime.now());
        s.setUpdatedByEmail(adminEmail);
        return toView(settingsRepository.save(s));
    }

    private SettingsView toView(VerificationSettings s) {
        List<String> types = Arrays.stream(s.getDocumentTypes().split(",")).map(String::trim).filter(t -> !t.isEmpty()).toList();
        return new SettingsView(types, s.getMaxFileSizeMb(), s.getInstructions(), s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null);
    }

    /* =====================  Resident: upload & own list  ===================== */

    @Transactional
    public DocumentSummary upload(String email, String documentType, MultipartFile file) {
        Apartment apt = dashboardService.resolveApartment(email);
        if (apt == null) throw new BadRequestException("Your account isn't linked to a household yet. Ask the community admin to link it first.");

        if (documentType == null || documentType.isBlank()) throw new BadRequestException("Choose a document type.");
        VerificationSettings settings = getOrCreateSettings();
        List<String> allowedTypes = Arrays.stream(settings.getDocumentTypes().split(",")).map(String::trim).toList();
        if (!allowedTypes.contains(documentType.trim()))
            throw new BadRequestException("'" + documentType + "' is not an accepted document type.");

        if (file == null || file.isEmpty()) throw new BadRequestException("Choose a file to upload.");
        long maxBytes = settings.getMaxFileSizeMb() * 1024L * 1024L;
        if (file.getSize() > maxBytes) throw new BadRequestException("File is larger than the " + settings.getMaxFileSizeMb() + " MB limit.");
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT)))
            throw new BadRequestException("Only PDF, JPG and PNG files are accepted.");
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) originalName = "document";
        if (originalName.length() > 200) originalName = originalName.substring(originalName.length() - 200);

        User user = userRepository.findByEmail(email).orElse(null);
        String uploaderName = user != null ? user.getFullName() : email;

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (java.io.IOException e) {
            throw new BadRequestException("Could not read the uploaded file. Please try again.");
        }

        DocumentVerification doc = new DocumentVerification(apt.getApartmentId(), email, uploaderName,
                documentType.trim(), originalName, contentType, file.getSize(), bytes);
        DocumentVerification saved = documentRepository.save(doc);
        return toSummary(saved, apt);
    }

    @Transactional(readOnly = true)
    public List<DocumentSummary> myDocuments(String email) {
        Apartment apt = dashboardService.resolveApartment(email);
        if (apt == null) return List.of();
        return documentRepository.findByApartmentIdOrderByUploadedAtDesc(apt.getApartmentId())
                .stream().map(d -> toSummary(d, apt)).toList();
    }

    /**
     * Lets a resident retract their own submission — only while it's still PENDING (untouched
     * by a reviewer). Once a reviewer has claimed it (UNDER_REVIEW) or decided it (VERIFIED /
     * REJECTED), the record stays as the audit trail of that decision.
     */
    @Transactional
    public void delete(Long documentId, String email) {
        DocumentVerification doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document " + documentId + " not found"));
        Apartment apt = dashboardService.resolveApartment(email);
        if (apt == null || !apt.getApartmentId().equals(doc.getApartmentId()))
            throw new BadRequestException("You can only remove your own documents.");
        if (!"PENDING".equals(doc.getStatus()))
            throw new BadRequestException("This document is already " + doc.getStatus().toLowerCase(Locale.ROOT).replace("_", " ")
                    + " and can no longer be removed.");
        documentRepository.delete(doc);
    }

    /* =====================  Download (ownership-checked)  ===================== */

    public record DownloadPayload(String fileName, String contentType, byte[] data) {}

    @Transactional(readOnly = true)
    public DownloadPayload download(Long documentId, String requesterEmail, String role) {
        DocumentVerification doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document " + documentId + " not found"));

        boolean isReviewer = "ROLE_PROPERTY_ADMIN".equalsIgnoreCase(role) || "ROLE_COMMUNITY_ADMIN".equalsIgnoreCase(role);
        if (!isReviewer) {
            Apartment apt = dashboardService.resolveApartment(requesterEmail);
            if (apt == null || !apt.getApartmentId().equals(doc.getApartmentId()))
                throw new BadRequestException("You can only download your own documents.");
        }
        return new DownloadPayload(doc.getFileName(), doc.getContentType(), doc.getFileData());
    }

    /* =====================  Review queue (community admin / admin)  ===================== */

    @Transactional(readOnly = true)
    public ReviewQueueResult reviewQueue(String status, String q, int page, int size) {
        List<DocumentVerification> all = documentRepository.findAllByOrderByUploadedAtDesc();
        Map<Long, Apartment> apts = apartmentRepository.findAll().stream()
                .collect(Collectors.toMap(Apartment::getApartmentId, Function.identity()));

        int pending = (int) all.stream().filter(d -> "PENDING".equals(d.getStatus())).count();
        int underReview = (int) all.stream().filter(d -> "UNDER_REVIEW".equals(d.getStatus())).count();
        int verified = (int) all.stream().filter(d -> "VERIFIED".equals(d.getStatus())).count();
        int rejected = (int) all.stream().filter(d -> "REJECTED".equals(d.getStatus())).count();

        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        List<DocumentSummary> filtered = all.stream()
                .filter(d -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status) || status.equalsIgnoreCase(d.getStatus()))
                .map(d -> toSummary(d, apts.get(d.getApartmentId())))
                .filter(s -> needle.isEmpty()
                        || (s.apartmentNumber() != null && s.apartmentNumber().toLowerCase(Locale.ROOT).contains(needle))
                        || (s.buildingName() != null && s.buildingName().toLowerCase(Locale.ROOT).contains(needle))
                        || (s.uploaderName() != null && s.uploaderName().toLowerCase(Locale.ROOT).contains(needle))
                        || (s.documentType() != null && s.documentType().toLowerCase(Locale.ROOT).contains(needle)))
                .toList();

        int sz = Math.min(Math.max(size, 1), 100);
        int pg = Math.max(page, 0);
        int from = Math.min(pg * sz, filtered.size());
        List<DocumentSummary> pageRows = filtered.subList(from, Math.min(from + sz, filtered.size()));

        return new ReviewQueueResult(all.size(), pending, underReview, verified, rejected, pg, sz, filtered.size(), new ArrayList<>(pageRows));
    }

    @Transactional
    public DocumentSummary review(Long documentId, String action, String reason, String reviewerEmail) {
        DocumentVerification doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document " + documentId + " not found"));
        if (action == null) throw new BadRequestException("Choose an action.");
        String next = switch (action.toUpperCase(Locale.ROOT)) {
            case "UNDER_REVIEW" -> "UNDER_REVIEW";
            case "VERIFY", "VERIFIED", "APPROVE" -> "VERIFIED";
            case "REJECT", "REJECTED" -> "REJECTED";
            default -> throw new BadRequestException("Action must be UNDER_REVIEW, VERIFY or REJECT.");
        };
        if ("REJECTED".equals(next) && (reason == null || reason.isBlank()))
            throw new BadRequestException("A rejection reason is required.");
        if (reason != null && reason.length() > 1000) throw new BadRequestException("Rejection reason must be 1000 characters or fewer.");
        if ("VERIFIED".equals(doc.getStatus()) || "REJECTED".equals(doc.getStatus()))
            throw new BadRequestException("This document was already " + doc.getStatus().toLowerCase(Locale.ROOT) + " and can't be reviewed again.");

        doc.setStatus(next);
        doc.setRejectionReason("REJECTED".equals(next) ? reason.trim() : null);
        doc.setReviewedByEmail(reviewerEmail);
        doc.setReviewedAt(LocalDateTime.now());
        DocumentVerification saved = documentRepository.save(doc);

        if ("VERIFIED".equals(next) || "REJECTED".equals(next)) {
            notifyStatusChange(saved);
        }

        return toSummary(saved, apartmentRepository.findById(saved.getApartmentId()).orElse(null));
    }

    /** Best-effort — a failed email must never undo or fail the review decision itself. */
    private void notifyStatusChange(DocumentVerification doc) {
        try {
            User user = userRepository.findByEmail(doc.getUploaderEmail()).orElse(null);
            String name = user != null ? user.getFullName() : doc.getUploaderName();
            emailService.sendDocumentStatusEmail(doc.getUploaderEmail(), name, doc.getDocumentType(),
                    doc.getStatus(), doc.getRejectionReason());
        } catch (Exception e) {
            log.warn("[DocumentVerificationService] Could not send status-change email for document {}: {}",
                    doc.getDocumentId(), e.getMessage());
        }
    }

    /* =====================  Stats (admin)  ===================== */

    @Transactional(readOnly = true)
    public Stats stats() {
        List<DocumentVerification> all = documentRepository.findAllByOrderByUploadedAtDesc();
        Map<Long, Apartment> apts = apartmentRepository.findAll().stream()
                .collect(Collectors.toMap(Apartment::getApartmentId, Function.identity()));

        int total = all.size();
        int pending = (int) all.stream().filter(d -> "PENDING".equals(d.getStatus())).count();
        int underReview = (int) all.stream().filter(d -> "UNDER_REVIEW".equals(d.getStatus())).count();
        int verified = (int) all.stream().filter(d -> "VERIFIED".equals(d.getStatus())).count();
        int rejected = (int) all.stream().filter(d -> "REJECTED".equals(d.getStatus())).count();
        int reviewed = verified + rejected;

        Map<String, List<DocumentVerification>> byBuildingRaw = all.stream()
                .collect(Collectors.groupingBy(d -> {
                    Apartment a = apts.get(d.getApartmentId());
                    return a != null && a.getBuildingName() != null ? a.getBuildingName() : "Unassigned";
                }, TreeMap::new, Collectors.toList()));
        List<BuildingStat> byBuilding = byBuildingRaw.entrySet().stream().map(e -> new BuildingStat(
                e.getKey(), e.getValue().size(),
                (int) e.getValue().stream().filter(d -> "PENDING".equals(d.getStatus())).count(),
                (int) e.getValue().stream().filter(d -> "UNDER_REVIEW".equals(d.getStatus())).count(),
                (int) e.getValue().stream().filter(d -> "VERIFIED".equals(d.getStatus())).count(),
                (int) e.getValue().stream().filter(d -> "REJECTED".equals(d.getStatus())).count()
        )).toList();

        List<TypeStat> byType = all.stream()
                .collect(Collectors.groupingBy(DocumentVerification::getDocumentType, TreeMap::new, Collectors.counting()))
                .entrySet().stream().map(e -> new TypeStat(e.getKey(), e.getValue().intValue())).toList();

        return new Stats(total, pending, underReview, verified, rejected,
                reviewed > 0 ? Math.round(verified * 10000.0 / reviewed) / 100.0 : 0.0, byBuilding, byType);
    }

    /* =====================  helpers  ===================== */

    private DocumentSummary toSummary(DocumentVerification d, Apartment apt) {
        return new DocumentSummary(d.getDocumentId(), d.getApartmentId(),
                apt != null ? apt.getApartmentNumber() : null, apt != null ? apt.getBuildingName() : null,
                d.getUploaderName(), d.getUploaderEmail(), d.getDocumentType(), d.getFileName(), d.getContentType(),
                d.getFileSize(), d.getStatus(), d.getRejectionReason(), d.getReviewedByEmail(),
                d.getReviewedAt() != null ? d.getReviewedAt().toString() : null,
                d.getUploadedAt() != null ? d.getUploadedAt().toString() : null);
    }
}
