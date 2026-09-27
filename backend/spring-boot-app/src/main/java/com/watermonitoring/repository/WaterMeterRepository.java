package com.watermonitoring.repository;

import com.watermonitoring.entity.WaterMeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WaterMeterRepository extends JpaRepository<WaterMeter, Long> {
    Optional<WaterMeter> findBySerialNumber(String serialNumber);
    Optional<WaterMeter> findByApartmentId(Long apartmentId);
}
