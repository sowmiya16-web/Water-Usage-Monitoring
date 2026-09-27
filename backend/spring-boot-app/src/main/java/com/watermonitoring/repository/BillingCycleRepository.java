package com.watermonitoring.repository;

import com.watermonitoring.entity.BillingCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BillingCycleRepository extends JpaRepository<BillingCycle, Long> {
    Optional<BillingCycle> findByStatus(String status);
    Optional<BillingCycle> findFirstByStatusOrderByStartDateAsc(String status);
    java.util.List<BillingCycle> findAllByOrderByStartDateDesc();
}
