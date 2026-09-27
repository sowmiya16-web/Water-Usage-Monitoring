package com.watermonitoring.repository;

import com.watermonitoring.entity.TariffPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TariffPlanRepository extends JpaRepository<TariffPlan, Long> {

    // Every tariff save inserts a new row (see TariffController) rather
    // than overwriting — these two give "the currently active version"
    // and "the full version history", both ordered by planId which is
    // monotonically increasing with insert order (and therefore also
    // with version number).
    Optional<TariffPlan> findTopByBuildingIdOrderByPlanIdDesc(Integer buildingId);
    List<TariffPlan> findByBuildingIdOrderByPlanIdDesc(Integer buildingId);

    default Optional<TariffPlan> findByBuildingId(Integer buildingId) {
        return findTopByBuildingIdOrderByPlanIdDesc(buildingId);
    }
}
