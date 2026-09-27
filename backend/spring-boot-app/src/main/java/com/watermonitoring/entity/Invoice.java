package com.watermonitoring.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * Invoice — The persisted PDF record for a successful payment. Generated
 * once at payment time (see PaymentService), stored here so it can be
 * re-downloaded later from Billing History / Payment History without
 * regenerating it, and independent of whether the confirmation email
 * succeeded.
 */
@Entity
@Table(name = "invoice")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "bill_id", nullable = false)
    private Long billId;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "apartment_id", nullable = false)
    private Long apartmentId;

    // Hibernate sizes a BLOB column from its length: the default (255) yields MySQL TINYBLOB, which
    // is far too small for a PDF. An explicit 32 MB length makes MySQL create LONGBLOB while staying
    // portable (no MySQL-only columnDefinition, so Postgres still works).
    @Lob
    @JdbcTypeCode(SqlTypes.BLOB)
    @Column(name = "pdf_data", nullable = false, length = 33_554_432)
    private byte[] pdfData;

    @Column(name = "sent_to_email", length = 150)
    private String sentToEmail;

    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt = LocalDateTime.now();

    public Invoice() {}

    public Invoice(String invoiceNumber, Long billId, Long paymentId, Long apartmentId, byte[] pdfData) {
        this.invoiceNumber = invoiceNumber;
        this.billId = billId;
        this.paymentId = paymentId;
        this.apartmentId = apartmentId;
        this.pdfData = pdfData;
        this.generatedAt = LocalDateTime.now();
    }

    public Long getInvoiceId() { return invoiceId; }
    public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Long getBillId() { return billId; }
    public void setBillId(Long billId) { this.billId = billId; }

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }

    public Long getApartmentId() { return apartmentId; }
    public void setApartmentId(Long apartmentId) { this.apartmentId = apartmentId; }

    public byte[] getPdfData() { return pdfData; }
    public void setPdfData(byte[] pdfData) { this.pdfData = pdfData; }

    public String getSentToEmail() { return sentToEmail; }
    public void setSentToEmail(String sentToEmail) { this.sentToEmail = sentToEmail; }

    public Boolean getEmailSent() { return emailSent != null ? emailSent : false; }
    public void setEmailSent(Boolean emailSent) { this.emailSent = emailSent; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
