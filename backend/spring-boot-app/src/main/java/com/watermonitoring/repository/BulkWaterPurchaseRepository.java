package com.watermonitoring.repository;

import com.watermonitoring.entity.BulkWaterPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkWaterPurchaseRepository extends JpaRepository<BulkWaterPurchase, Long> {
    List<BulkWaterPurchase> findByBillingCycleId(Long billingCycleId);
    List<BulkWaterPurchase> findAllByOrderByDeliveryDateDescPurchaseIdDesc();
}
