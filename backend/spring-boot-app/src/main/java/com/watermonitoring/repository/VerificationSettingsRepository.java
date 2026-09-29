package com.watermonitoring.repository;

import com.watermonitoring.entity.VerificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationSettingsRepository extends JpaRepository<VerificationSettings, Integer> {
}
