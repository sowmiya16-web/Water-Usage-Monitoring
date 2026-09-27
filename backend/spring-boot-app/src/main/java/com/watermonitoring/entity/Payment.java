package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "transaction_ref", nullable = false, unique = true, length = 100)
    private String transactionRef;

    @Column(name = "bill_id", nullable = false)
    private Long billId;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod;

    @Column(name = "status", length = 20)
    private String status = "SUCCESSFUL";

    @Column(name = "paid_at")
    private LocalDateTime paidAt = LocalDateTime.now();

    public Payment() {}

    public Payment(String transactionRef, Long billId, Double amount, String paymentMethod, String status) {
        this.transactionRef = transactionRef;
        this.billId = billId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.status = status != null ? status : "SUCCESSFUL";
        this.paidAt = LocalDateTime.now();
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }

    public Long getBillId() {
        return billId;
    }

    public void setBillId(Long billId) {
        this.billId = billId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
