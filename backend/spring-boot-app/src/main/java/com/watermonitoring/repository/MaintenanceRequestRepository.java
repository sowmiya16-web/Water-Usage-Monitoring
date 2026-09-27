package com.watermonitoring.repository;

import com.watermonitoring.entity.MaintenanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {
    Optional<MaintenanceRequest> findByTaskNumber(String taskNumber);
    List<MaintenanceRequest> findByStatus(String status);
}
