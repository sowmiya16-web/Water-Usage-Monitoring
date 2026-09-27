package com.watermonitoring.repository;

import com.watermonitoring.entity.WaterUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Repository
public interface WaterUsageRepository extends JpaRepository<WaterUsage, Long> {
    List<WaterUsage> findByMeterId(Long meterId);
    List<WaterUsage> findByMeterIdAndReadingDateBetween(Long meterId, LocalDate startDate, LocalDate endDate);
    Optional<WaterUsage> findTopByMeterIdOrderByReadingDateDescUsageIdDesc(Long meterId);
    List<WaterUsage> findByReadingDateBetween(LocalDate startDate, LocalDate endDate);
    List<WaterUsage> findTop50ByOrderByRecordedAtDesc();
    boolean existsByMeterIdAndReadingDate(Long meterId, LocalDate readingDate);

    /** [meterId, year, month, sumKl, readingDays, peakDayKl] for every meter, grouped by calendar month. */
    @Query("select u.meterId, year(u.readingDate), month(u.readingDate), sum(u.consumptionKl), count(u), max(u.consumptionKl) "
            + "from WaterUsage u where u.readingDate between :from and :to "
            + "group by u.meterId, year(u.readingDate), month(u.readingDate)")
    List<Object[]> monthlyTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** Same roll-up restricted to one meter. */
    @Query("select u.meterId, year(u.readingDate), month(u.readingDate), sum(u.consumptionKl), count(u), max(u.consumptionKl) "
            + "from WaterUsage u where u.meterId = :meterId and u.readingDate between :from and :to "
            + "group by u.meterId, year(u.readingDate), month(u.readingDate)")
    List<Object[]> monthlyTotalsForMeter(@Param("meterId") Long meterId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    /** [meterId, sumKl, readingDays] over an arbitrary date window. */
    @Query("select u.meterId, sum(u.consumptionKl), count(u) from WaterUsage u "
            + "where u.readingDate between :from and :to group by u.meterId")
    List<Object[]> periodTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** [meterId, latest reading date] for every meter that has readings. */
    @Query("select u.meterId, max(u.readingDate) from WaterUsage u group by u.meterId")
    List<Object[]> lastReadingDates();

    List<WaterUsage> findTop30ByMeterIdOrderByReadingDateDescUsageIdDesc(Long meterId);

    @Modifying
    @Query("delete from WaterUsage u where u.meterId = :meterId")
    void deleteAllByMeterId(@Param("meterId") Long meterId);
}

