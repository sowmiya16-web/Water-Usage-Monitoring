package com.watermonitoring.repository;

import com.watermonitoring.entity.DocumentVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentVerificationRepository extends JpaRepository<DocumentVerification, Long> {
    List<DocumentVerification> findByApartmentIdOrderByUploadedAtDesc(Long apartmentId);
    List<DocumentVerification> findAllByOrderByUploadedAtDesc();
    long countByStatus(String status);
}
