package com.watermonitoring.repository;

import com.watermonitoring.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findTopByBillIdOrderByGeneratedAtDesc(Long billId);
    List<Invoice> findByApartmentIdOrderByGeneratedAtDesc(Long apartmentId);
    Optional<Invoice> findByPaymentId(Long paymentId);
}
