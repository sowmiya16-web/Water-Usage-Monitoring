package com.watermonitoring.controller;

import com.watermonitoring.dto.ApiResponse;
import com.watermonitoring.entity.Bill;
import com.watermonitoring.entity.Payment;
import com.watermonitoring.repository.BillRepository;
import com.watermonitoring.repository.PaymentRepository;
import com.watermonitoring.service.BillSchedulerService;
import com.watermonitoring.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final BillSchedulerService billSchedulerService;
    private final PaymentService paymentService;
    private final com.watermonitoring.service.ResidentDashboardService residentDashboardService;

    @Autowired
    public BillController(BillRepository billRepository,
                          PaymentRepository paymentRepository,
                          BillSchedulerService billSchedulerService,
                          PaymentService paymentService,
                          com.watermonitoring.service.ResidentDashboardService residentDashboardService) {
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
        this.billSchedulerService = billSchedulerService;
        this.paymentService = paymentService;
        this.residentDashboardService = residentDashboardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Bill>>> getAllBills() {
        List<Bill> bills = billRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Bills retrieved successfully", bills));
    }

    @GetMapping("/my-bills")
    public ResponseEntity<ApiResponse<List<Bill>>> getMyBills(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        com.watermonitoring.entity.Apartment apt = residentDashboardService.resolveApartment(email);
        if (apt == null) {
            return ResponseEntity.ok(ApiResponse.success("No apartment associated with resident", List.of()));
        }
        List<Bill> bills = billRepository.findByApartmentId(apt.getApartmentId());
        return ResponseEntity.ok(ApiResponse.success("My bills retrieved successfully", bills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Bill>> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(b -> ResponseEntity.ok(ApiResponse.success("Bill retrieved successfully", b)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Bill not found", null)));
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<List<Bill>>> getBillsByApartment(@PathVariable Long apartmentId) {
        List<Bill> bills = billRepository.findByApartmentId(apartmentId);
        return ResponseEntity.ok(ApiResponse.success("Apartment bills retrieved", bills));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Bill>> createBill(@RequestBody Bill bill) {
        Bill saved = billRepository.save(bill);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill generated successfully", saved));
    }

    @PostMapping("/generate-monthly")
    public ResponseEntity<ApiResponse<List<Bill>>> generateMonthlyBills(@RequestParam(required = false) Double consumption) {
        List<Bill> generated = billSchedulerService.generateMonthlyBills(consumption);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Monthly bills generated/recalculated successfully", generated));
    }

    /**
     * Processes a payment for a bill. Reliable (transactional — bill
     * status and payment record are committed together), idempotent (a
     * bill already marked PAID cannot be paid twice), and in order (an
     * older unpaid bill for the same apartment must be settled first). On
     * success, a confirmation email with a PDF invoice is sent to the
     * resident from the configured official SMTP account.
     */
    @PostMapping("/{billId}/pay")
    public ResponseEntity<ApiResponse<Payment>> processPayment(@PathVariable Long billId, @RequestBody(required = false) Payment payment) {
        try {
            // The receipt goes to the signed-in user's registered email —
            // never an address supplied by the client.
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String payerEmail = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                    ? auth.getName() : null;
            Payment savedPayment = paymentService.processPayment(billId, payment, payerEmail);
            return ResponseEntity.ok(ApiResponse.success("Payment recorded successfully", savedPayment));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), null));
        } catch (PaymentService.BillAlreadyPaidException | PaymentService.OlderBillPendingException
                 | PaymentService.BillNotPayableException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage(), null));
        }
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", payments));
    }

    @GetMapping("/payments/my-payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getMyPayments(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        com.watermonitoring.entity.Apartment apt = residentDashboardService.resolveApartment(email);
        if (apt == null) {
            return ResponseEntity.ok(ApiResponse.success("No apartment associated with resident", List.of()));
        }
        List<Bill> bills = billRepository.findByApartmentId(apt.getApartmentId());
        List<Long> billIds = bills.stream().map(Bill::getBillId).toList();
        List<Payment> payments = billIds.isEmpty() ? List.of() : paymentRepository.findByBillIdIn(billIds);
        return ResponseEntity.ok(ApiResponse.success("My payments retrieved successfully", payments));
    }

    @GetMapping("/payments/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByApartment(@PathVariable Long apartmentId) {
        List<Bill> bills = billRepository.findByApartmentId(apartmentId);
        List<Long> billIds = bills.stream().map(Bill::getBillId).toList();
        List<Payment> payments = billIds.isEmpty() ? List.of() : paymentRepository.findByBillIdIn(billIds);
        return ResponseEntity.ok(ApiResponse.success("Apartment payments retrieved successfully", payments));
    }
}
