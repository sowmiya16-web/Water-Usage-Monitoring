package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.InvoiceSummary;
import com.watermonitoring.entity.Apartment;
import com.watermonitoring.entity.Invoice;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.InvoiceRepository;
import com.watermonitoring.service.ResidentDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * InvoiceController — Every payment invoice is generated once (at payment
 * time) and stored as a PDF in the database; these endpoints let the
 * Resident Portal (Billing History / Payment History) list and download
 * them. PDF only — no CSV/Excel export exists for invoices.
 *
 * A resident may only ever see/download their own apartment's invoices; admins and community
 * admins may access any (see SecurityConfig for the role gate).
 */
@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final ResidentDashboardService dashboardService;

    @Autowired
    public InvoiceController(InvoiceRepository invoiceRepository, ResidentDashboardService dashboardService) {
        this.invoiceRepository = invoiceRepository;
        this.dashboardService = dashboardService;
    }

    private static String roleOf(Authentication auth) {
        return auth != null ? auth.getAuthorities().stream().findFirst().map(GrantedAuthority::getAuthority).orElse("") : "";
    }

    private static boolean isReviewer(String role) {
        return "ROLE_PROPERTY_ADMIN".equalsIgnoreCase(role) || "ROLE_COMMUNITY_ADMIN".equalsIgnoreCase(role);
    }

    /** Residents may only pass their own apartmentId; reviewers (admin roles) may pass any. */
    private void checkApartmentAccess(Long apartmentId, Authentication authentication) {
        String role = roleOf(authentication);
        if (isReviewer(role)) return;
        String email = authentication != null ? authentication.getName() : null;
        Apartment apt = dashboardService.resolveApartment(email);
        if (apt == null || !apt.getApartmentId().equals(apartmentId))
            throw new BadRequestException("You can only view your own household's invoices.");
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<List<InvoiceSummary>>> getInvoicesForApartment(@PathVariable Long apartmentId, Authentication authentication) {
        checkApartmentAccess(apartmentId, authentication);
        List<InvoiceSummary> invoices = invoiceRepository.findByApartmentIdOrderByGeneratedAtDesc(apartmentId)
                .stream().map(InvoiceSummary::new).toList();
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved", invoices));
    }

    @GetMapping("/bill/{billId}")
    public ResponseEntity<ApiResponse<InvoiceSummary>> getInvoiceForBill(@PathVariable Long billId, Authentication authentication) {
        Invoice invoice = invoiceRepository.findTopByBillIdOrderByGeneratedAtDesc(billId)
                .orElseThrow(() -> new ResourceNotFoundException("No invoice has been generated for this bill yet"));
        checkApartmentAccess(invoice.getApartmentId(), authentication);
        return ResponseEntity.ok(ApiResponse.success("Invoice retrieved", new InvoiceSummary(invoice)));
    }

    @GetMapping("/{invoiceId}/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long invoiceId, Authentication authentication) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice " + invoiceId + " not found"));
        checkApartmentAccess(invoice.getApartmentId(), authentication);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"")
                .body(invoice.getPdfData());
    }
}
