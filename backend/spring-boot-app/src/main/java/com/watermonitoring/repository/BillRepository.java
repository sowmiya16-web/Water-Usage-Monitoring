package com.watermonitoring.repository;

import com.watermonitoring.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    List<Bill> findByApartmentId(Long apartmentId);
    List<Bill> findByApartmentIdOrderByCreatedAtAsc(Long apartmentId);
    List<Bill> findByStatus(String status);
    // Chronological (oldest-first) processing order — used when
    // recalculating bills for a new tariff version and when generating a
    // batch of bills, so changes are always applied one-by-one in the
    // order the bills were originally created.
    List<Bill> findByStatusOrderByCreatedAtAsc(String status);
}
