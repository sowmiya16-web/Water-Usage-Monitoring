package com.watermonitoring.config;

import com.watermonitoring.entity.Apartment;
import com.watermonitoring.entity.WaterMeter;
import com.watermonitoring.entity.WaterUsage;
import com.watermonitoring.repository.ApartmentRepository;
import com.watermonitoring.repository.WaterMeterRepository;
import com.watermonitoring.repository.WaterUsageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

/**
 * DemoUsageSeeder — The dashboards chart real meter readings from
 * water_usage, but a fresh database has none. When (and only when) that
 * table is completely empty, this creates a meter for the first apartment
 * (if it lacks one) and ~6 months of plausible daily readings so the
 * charts have something to show. Once any real reading exists it never
 * runs again, and it never modifies existing rows.
 */
@Component
public class DemoUsageSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUsageSeeder.class);
    private static final int DAYS = 180;

    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;

    @Autowired
    public DemoUsageSeeder(ApartmentRepository apartmentRepository, WaterMeterRepository meterRepository,
                           WaterUsageRepository usageRepository) {
        this.apartmentRepository = apartmentRepository;
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (usageRepository.count() > 0) return;
            Apartment apt = apartmentRepository.findAll().stream()
                    .min(Comparator.comparing(Apartment::getApartmentId)).orElse(null);
            if (apt == null) return;

            WaterMeter meter = meterRepository.findByApartmentId(apt.getApartmentId()).orElseGet(() ->
                    meterRepository.save(new WaterMeter("WM-" + apt.getApartmentNumber() + "-2026", apt.getApartmentId(), 92, 88, "ONLINE")));

            Random rnd = new Random(apt.getApartmentId());
            LocalDate today = LocalDate.now();
            double cumulative = 1250.0;
            List<WaterUsage> rows = new ArrayList<>();
            for (int i = DAYS - 1; i >= 0; i--) {
                LocalDate d = today.minusDays(i);
                double base = 0.78;                                          // ~24 KL / month household
                if (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) base += 0.16;
                double seasonal = 1.0 + 0.10 * Math.sin((d.getDayOfYear() / 365.0) * 2 * Math.PI);
                double kl = Math.max(0.35, base * seasonal + rnd.nextGaussian() * 0.09);
                kl = Math.round(kl * 100.0) / 100.0;
                rows.add(new WaterUsage(meter.getMeterId(), cumulative, Math.round((cumulative + kl) * 100.0) / 100.0, kl, d));
                cumulative += kl;
            }
            usageRepository.saveAll(rows);
            log.info("[DemoUsageSeeder] water_usage was empty — seeded {} days of demo readings for meter {}.", rows.size(), meter.getSerialNumber());
        } catch (Exception e) {
            log.warn("[DemoUsageSeeder] Skipped: {}", e.getMessage());
        }
    }
}
