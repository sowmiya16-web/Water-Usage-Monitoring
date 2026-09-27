package com.watermonitoring.service;

import com.watermonitoring.entity.Alert;
import com.watermonitoring.entity.Apartment;
import com.watermonitoring.entity.Bill;
import com.watermonitoring.entity.Invoice;
import com.watermonitoring.entity.Payment;
import com.watermonitoring.entity.User;
import com.watermonitoring.repository.AlertRepository;
import com.watermonitoring.repository.ApartmentRepository;
import com.watermonitoring.repository.BillRepository;
import com.watermonitoring.repository.InvoiceRepository;
import com.watermonitoring.repository.PaymentRepository;
import com.watermonitoring.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * PaymentService — Processes bill payments reliably and in order:
 *  - Transactional: the bill status update and the payment record are
 *    committed together or not at all.
 *  - Idempotent: a bill that's already PAID cannot be paid again.
 *  - In order: if the same apartment has an older unpaid bill, it must be
 *    settled first — payments can't skip ahead of arrears.
 *  - Both the Payment record and the Bill's status (and therefore the
 *    resident's Billing History, which just reads current Bill rows) are
 *    updated together.
 *  - On success, sends a confirmation email with a PDF invoice via the
 *    configured official SMTP account — best-effort, never rolls back the
 *    payment if the email fails to send.
 */
@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final AlertRepository alertRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final EmailService emailService;

    @Autowired
    public PaymentService(BillRepository billRepository,
                           PaymentRepository paymentRepository,
                           AlertRepository alertRepository,
                           ApartmentRepository apartmentRepository,
                           UserRepository userRepository,
                           InvoiceRepository invoiceRepository,
                           InvoiceService invoiceService,
                           EmailService emailService) {
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
        this.alertRepository = alertRepository;
        this.apartmentRepository = apartmentRepository;
        this.userRepository = userRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceService = invoiceService;
        this.emailService = emailService;
    }

    public static class BillAlreadyPaidException extends RuntimeException {
        public BillAlreadyPaidException(String message) { super(message); }
    }

    public static class OlderBillPendingException extends RuntimeException {
        public OlderBillPendingException(String message) { super(message); }
    }

    public static class BillNotPayableException extends RuntimeException {
        public BillNotPayableException(String message) { super(message); }
    }

    @Transactional
    public Payment processPayment(Long billId, Payment payObj, String payerEmail) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new NoSuchElementException("Bill not found for payment"));

        // Idempotency: never process the same bill twice.
        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            throw new BillAlreadyPaidException("This bill (" + bill.getBillNumber() + ") has already been paid.");
        }

        // A SUPERSEDED bill was replaced by a tariff-triggered
        // recalculation (see BillSchedulerService) — it's a stale
        // historical record, not something that can be paid. Only the
        // bill it was replaced by (linked via supersededByBillId) is payable.
        if (!"PENDING".equalsIgnoreCase(bill.getStatus())) {
            String hint = bill.getSupersededByBillId() != null
                    ? " It was recalculated — please pay the newer bill (ID " + bill.getSupersededByBillId() + ") instead."
                    : "";
            throw new BillNotPayableException(
                    "This bill (" + bill.getBillNumber() + ") is " + bill.getStatus() + " and can no longer be paid." + hint);
        }

        // Chronological order: settle older unpaid bills for this
        // apartment before this one.
        List<Bill> olderUnpaid = billRepository.findByApartmentId(bill.getApartmentId()).stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                .filter(b -> !b.getBillId().equals(bill.getBillId()))
                .filter(b -> b.getCreatedAt() != null && bill.getCreatedAt() != null && b.getCreatedAt().isBefore(bill.getCreatedAt()))
                .sorted(Comparator.comparing(Bill::getCreatedAt))
                .toList();

        if (!olderUnpaid.isEmpty()) {
            Bill oldest = olderUnpaid.get(0);
            throw new OlderBillPendingException(
                    "Please settle your oldest pending bill first: " + oldest.getBillNumber()
                            + " (" + oldest.getBillingMonth() + ")");
        }

        bill.setStatus("PAID");
        billRepository.save(bill);

        if (payObj == null) {
            payObj = new Payment();
        }
        payObj.setBillId(billId);
        if (payObj.getTransactionRef() == null || payObj.getTransactionRef().trim().isEmpty()) {
            payObj.setTransactionRef("TXN-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 9000 + 1000));
        }
        if (payObj.getPaidAt() == null) {
            payObj.setPaidAt(LocalDateTime.now());
        }
        if (payObj.getAmount() == null) {
            payObj.setAmount(bill.getTotalAmount());
        }
        if (payObj.getPaymentMethod() == null || payObj.getPaymentMethod().trim().isEmpty()) {
            payObj.setPaymentMethod("UPI");
        }
        if (payObj.getStatus() == null || payObj.getStatus().trim().isEmpty()) {
            payObj.setStatus("SUCCESSFUL");
        }

        Payment savedPayment = paymentRepository.save(payObj);

        logPaymentAlert(bill, savedPayment);
        generateSaveAndSendInvoice(bill, savedPayment, payerEmail);

        return savedPayment;
    }

    private void logPaymentAlert(Bill bill, Payment savedPayment) {
        try {
            String alertRef = "ALT-PAY-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            String title = "Payment Received & Settled";
            String message = String.format("Payment of ₹%.2f via %s for %s was successfully received and settled. Transaction Ref: %s.",
                    savedPayment.getAmount(), savedPayment.getPaymentMethod(),
                    bill.getBillingMonth() != null ? bill.getBillingMonth() : "Water Bill",
                    savedPayment.getTransactionRef());

            Alert alert = new Alert(
                    alertRef, bill.getApartmentId(), null, "PAYMENT_RECEIVED", title, message,
                    savedPayment.getAmount(), bill.getTotalAmount(), 0.0, 0.0,
                    "INFO", "ACTIVE", false, bill.getBillId(), null
            );
            alertRepository.save(alert);
        } catch (Exception e) {
            logger.warn("[PaymentService] Could not log payment alert for bill {}: {}", bill.getBillId(), e.getMessage());
        }
    }

    /**
     * Generates the invoice PDF exactly once, SAVES it (so it's always
     * downloadable from Billing History / Payment History regardless of
     * what happens next), then attempts to email it. Generation/saving
     * and emailing are independent: a failed email never removes the
     * saved PDF, and this whole step never undoes the payment that
     * already committed above — any exception here is swallowed/logged.
     */
    private void generateSaveAndSendInvoice(Bill bill, Payment payment, String payerEmail) {
        Apartment apartment = apartmentRepository.findById(bill.getApartmentId()).orElse(null);

        // The invoice always goes to the email the payer registered with
        // (taken from their signed-in identity, never from the request
        // body). Only if the payment wasn't made while signed in do we
        // fall back to the resident linked to the apartment.
        User resident = null;
        if (payerEmail != null && !payerEmail.isBlank()) {
            resident = userRepository.findByEmail(payerEmail.trim()).orElse(null);
        }
        if (resident == null && apartment != null && apartment.getResidentUserId() != null) {
            resident = userRepository.findById(apartment.getResidentUserId()).orElse(null);
        }

        byte[] invoicePdf;
        try {
            invoicePdf = invoiceService.generateInvoicePdf(bill, payment, apartment, resident);
            if (invoicePdf == null) {
                logger.warn("[PaymentService] Invoice PDF generation returned null for bill {}.", bill.getBillId());
                return;
            }
        } catch (Exception e) {
            logger.error("[PaymentService] Invoice PDF generation failed for bill {}: {}", bill.getBillId(), e.getMessage());
            return;
        }

        String invoiceNumber = bill.getBillNumber() != null && bill.getBillNumber().toUpperCase().startsWith("INV-")
                ? bill.getBillNumber()
                : "INV-" + bill.getBillNumber();
        Invoice invoice = new Invoice(invoiceNumber, bill.getBillId(), payment.getPaymentId(), bill.getApartmentId(), invoicePdf);

        String recipient = (payerEmail != null && !payerEmail.isBlank())
                ? payerEmail.trim()
                : (resident != null ? resident.getEmail() : null);
        invoice.setSentToEmail(recipient);

        try {
            invoice = invoiceRepository.save(invoice);
            logger.info("[PaymentService] Invoice {} saved for bill {}.", invoiceNumber, bill.getBillId());
        } catch (Exception e) {
            logger.error("[PaymentService] Could not save invoice for bill {}: {}", bill.getBillId(), e.getMessage());
            return;
        }

        if (recipient == null || recipient.isBlank()) {
            logger.info("[PaymentService] No recipient email available for bill {} — invoice saved but not emailed.", bill.getBillId());
            return;
        }

        try {
            String residentName = resident != null ? resident.getFullName() : "Resident";
            boolean sent = emailService.sendPaymentConfirmationEmail(recipient, residentName, bill, payment, invoicePdf);
            invoice.setEmailSent(sent);
            invoiceRepository.save(invoice);
        } catch (Exception e) {
            logger.warn("[PaymentService] Payment confirmation email failed for bill {}: {}", bill.getBillId(), e.getMessage());
        }
    }
}
