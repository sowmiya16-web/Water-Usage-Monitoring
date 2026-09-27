package com.watermonitoring.repository;

import com.watermonitoring.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionRef(String transactionRef);
    List<Payment> findByBillId(Long billId);
    List<Payment> findByBillIdIn(List<Long> billIds);
}
