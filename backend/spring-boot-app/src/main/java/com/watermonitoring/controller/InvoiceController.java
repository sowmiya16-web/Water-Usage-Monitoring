package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.dto.InvoiceSummary;
import com.watermonitoring.entity.Invoice;
import com.watermonitoring.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * InvoiceController — Every payment invoice is generated once (at payment
 * time) and stored as a PDF in the database; these endpoints let the
 * Resident Portal (Billing History / Payment History) list and download
 * them. PDF only — no CSV/Excel export exists for invoices.
 */
@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;

    @Autowired
    public InvoiceController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<List<InvoiceSummary>>> getInvoicesForApartment(@PathVariable Long apartmentId) {
        List<InvoiceSummary> invoices = invoiceRepository.findByApartmentIdOrderByGeneratedAtDesc(apartmentId)
                .stream().map(InvoiceSummary::new).toList();
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved", invoices));
    }

    @GetMapping("/bill/{billId}")
    public ResponseEntity<ApiResponse<InvoiceSummary>> getInvoiceForBill(@PathVariable Long billId) {
        return invoiceRepository.findTopByBillIdOrderByGeneratedAtDesc(billId)
                .map(inv -> ResponseEntity.ok(ApiResponse.success("Invoice retrieved", new InvoiceSummary(inv))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("No invoice has been generated for this bill yet", null)));
    }

    @GetMapping("/{invoiceId}/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .map(invoice -> ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"")
                        .body(invoice.getPdfData()))
                .orElse(ResponseEntity.notFound().build());
    }
}
