package com.watermonitoring.config;

import com.watermonitoring.service.HouseholdService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Keeps the resident table consistent with apartments on every start (idempotent, additive only). */
@Component
@Order(1)
public class HouseholdDataBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(HouseholdDataBackfill.class);
    private final HouseholdService householdService;

    @Autowired
    public HouseholdDataBackfill(HouseholdService householdService) {
        this.householdService = householdService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int n = householdService.backfillResidents();
            if (n > 0) log.info("[HouseholdDataBackfill] Linked or created {} resident record(s) for existing households.", n);
        } catch (Exception e) {
            log.warn("[HouseholdDataBackfill] Skipped: {}", e.getMessage());
        }
    }
}
