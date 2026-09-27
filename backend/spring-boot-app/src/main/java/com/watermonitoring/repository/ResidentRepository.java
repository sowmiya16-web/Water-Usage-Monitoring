package com.watermonitoring.repository;

import com.watermonitoring.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Long> {
    Optional<Resident> findByEmail(String email);
    Optional<Resident> findByUserId(Long userId);
    List<Resident> findByBuildingName(String buildingName);
    boolean existsByEmail(String email);
    List<Resident> findByApartmentId(Long apartmentId);
    void deleteByApartmentId(Long apartmentId);
}
