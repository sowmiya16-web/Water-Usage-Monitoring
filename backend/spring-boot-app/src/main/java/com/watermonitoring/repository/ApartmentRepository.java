package com.watermonitoring.repository;

import com.watermonitoring.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    Optional<Apartment> findByApartmentNumberAndBuildingName(String apartmentNumber, String buildingName);

    Optional<Apartment> findByApartmentNumber(String apartmentNumber);

    Optional<Apartment> findByResidentUserId(Long residentUserId);

    List<Apartment> findByBuildingName(String buildingName);

    List<Apartment> findByOccupancyStatus(String occupancyStatus);

    boolean existsByApartmentNumberAndBuildingName(String apartmentNumber, String buildingName);
}
