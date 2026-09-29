package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.service.DocumentVerificationService;
import com.watermonitoring.service.DocumentVerificationService.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Document Verification API. Ownership and review-role checks happen inside the service
 * (a resident may only ever see/download their own documents); SecurityConfig restricts
 * the review-queue, review-action, stats and settings-write endpoints by role on top of that.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentVerificationController {

    private final DocumentVerificationService service;

    @Autowired
    public DocumentVerificationController(DocumentVerificationService service) {
        this.service = service;
    }

    public record ReviewRequest(String action, String reason) {}
    public record SettingsRequest(List<String> documentTypes, Integer maxFileSizeMb, String instructions) {}

    private static String emailOf(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }

    private static String roleOf(Authentication auth) {
        return auth != null && !auth.getAuthorities().isEmpty() ? auth.getAuthorities().iterator().next().getAuthority() : "";
    }

    /* ---- resident: upload & own documents ---- */

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentSummary>> upload(@RequestParam("documentType") String documentType,
                                                               @RequestParam("file") MultipartFile file,
                                                               Authentication authentication) {
        DocumentSummary saved = service.upload(emailOf(authentication), documentType, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Document uploaded — pending review", saved));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<DocumentSummary>>> myDocuments(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Your documents", service.myDocuments(emailOf(authentication))));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id, Authentication authentication) {
        DownloadPayload p = service.download(id, emailOf(authentication), roleOf(authentication));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(p.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + p.fileName().replace("\"", "") + "\"")
                .body(p.data());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        service.delete(id, emailOf(authentication));
        return ResponseEntity.ok(ApiResponse.success("Document removed", null));
    }

    /* ---- community admin / admin: review queue ---- */

    @GetMapping("/review-queue")
    public ResponseEntity<ApiResponse<ReviewQueueResult>> reviewQueue(@RequestParam(required = false) String status,
                                                                      @RequestParam(required = false) String q,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Review queue", service.reviewQueue(status, q, page, size)));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<DocumentSummary>> review(@PathVariable Long id, @RequestBody ReviewRequest req,
                                                               Authentication authentication) {
        DocumentSummary updated = service.review(id, req.action(), req.reason(), emailOf(authentication));
        return ResponseEntity.ok(ApiResponse.success("Document " + updated.status().toLowerCase().replace("_", " "), updated));
    }

    /* ---- admin: stats & settings ---- */

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Stats>> stats() {
        return ResponseEntity.ok(ApiResponse.success("Verification statistics", service.stats()));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<SettingsView>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success("Verification settings", service.getSettings()));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<SettingsView>> updateSettings(@RequestBody SettingsRequest req, Authentication authentication) {
        SettingsView updated = service.updateSettings(req.documentTypes(), req.maxFileSizeMb(), req.instructions(), emailOf(authentication));
        return ResponseEntity.ok(ApiResponse.success("Settings updated", updated));
    }
}
