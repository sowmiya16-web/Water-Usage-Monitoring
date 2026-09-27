package com.watermonitoring.repository;

import com.watermonitoring.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByApartmentIdOrderByCreatedAtDesc(Long apartmentId);

    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Alert> findAllByOrderByCreatedAtDesc();

    long countByApartmentIdAndAcknowledgedFalse(Long apartmentId);

    long countByUserIdAndAcknowledgedFalse(Long userId);

    boolean existsByBillIdAndAlertType(Long billId, String alertType);

    boolean existsByUsageIdAndAlertType(Long usageId, String alertType);
}
