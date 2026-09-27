package com.watermonitoring.dto;

import com.watermonitoring.entity.Invoice;

import java.time.LocalDateTime;

/**
 * InvoiceSummary — Invoice metadata without the PDF bytes, for list views
 * (Billing History / Payment History "Download PDF" links).
 */
public class InvoiceSummary {
    private Long invoiceId;
    private String invoiceNumber;
    private Long billId;
    private Long paymentId;
    private Long apartmentId;
    private String sentToEmail;
    private Boolean emailSent;
    private LocalDateTime generatedAt;

    public InvoiceSummary(Invoice invoice) {
        this.invoiceId = invoice.getInvoiceId();
        this.invoiceNumber = invoice.getInvoiceNumber();
        this.billId = invoice.getBillId();
        this.paymentId = invoice.getPaymentId();
        this.apartmentId = invoice.getApartmentId();
        this.sentToEmail = invoice.getSentToEmail();
        this.emailSent = invoice.getEmailSent();
        this.generatedAt = invoice.getGeneratedAt();
    }

    public Long getInvoiceId() { return invoiceId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public Long getBillId() { return billId; }
    public Long getPaymentId() { return paymentId; }
    public Long getApartmentId() { return apartmentId; }
    public String getSentToEmail() { return sentToEmail; }
    public Boolean getEmailSent() { return emailSent; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
}
