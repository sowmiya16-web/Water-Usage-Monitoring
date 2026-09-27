package com.watermonitoring.repository;

import com.watermonitoring.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {
    Optional<Building> findByBuildingName(String buildingName);
    boolean existsByBuildingName(String buildingName);
}
