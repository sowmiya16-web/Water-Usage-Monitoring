package com.watermonitoring.service;

import com.watermonitoring.dto.AlertConfigDto;
import com.watermonitoring.entity.*;
import com.watermonitoring.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AlertEngineService {

    private static final Logger logger = LoggerFactory.getLogger(AlertEngineService.class);

    private final AlertRepository alertRepository;
    private final BillRepository billRepository;
    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;
    private final TariffPlanRepository tariffRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Configurable Alert Thresholds (Can be modified via REST API)
    private AlertConfigDto config = new AlertConfigDto(100.0, 25.0, 2.0, true);

    @Autowired
    public AlertEngineService(
            AlertRepository alertRepository,
            BillRepository billRepository,
            WaterMeterRepository meterRepository,
            WaterUsageRepository usageRepository,
            TariffPlanRepository tariffRepository,
            ApartmentRepository apartmentRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.alertRepository = alertRepository;
        this.billRepository = billRepository;
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
        this.tariffRepository = tariffRepository;
        this.apartmentRepository = apartmentRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public AlertConfigDto getConfig() {
        return config;
    }

    public AlertConfigDto updateConfig(AlertConfigDto newConfig) {
        if (newConfig != null) {
            if (newConfig.getBillOverchargeThreshold() != null) {
                this.config.setBillOverchargeThreshold(newConfig.getBillOverchargeThreshold());
            }
            if (newConfig.getConsumptionThresholdKl() != null) {
                this.config.setConsumptionThresholdKl(newConfig.getConsumptionThresholdKl());
            }
            if (newConfig.getSigmaMultiplier() != null) {
                this.config.setSigmaMultiplier(newConfig.getSigmaMultiplier());
            }
            if (newConfig.getEnableEmailAlerts() != null) {
                this.config.setEnableEmailAlerts(newConfig.getEnableEmailAlerts());
            }
        }
        logger.info("[AlertEngine] Config updated: OverchargeThreshold=₹{}, ConsumptionThreshold={}KL, SigmaMultiplier={}x, EmailAlerts={}",
                config.getBillOverchargeThreshold(), config.getConsumptionThresholdKl(), config.getSigmaMultiplier(), config.getEnableEmailAlerts());
        return this.config;
    }

    /**
     * Periodic Scheduled Automated Alert Evaluation Engine
     * Runs every 60 seconds (60,000 ms) automatically.
     */
    @Scheduled(fixedRate = 60000)
    public void runScheduledAlertEvaluation() {
        logger.info("[AlertEngine] Starting periodic @Scheduled alert evaluation cycle...");
        try {
            int generatedCount = evaluateAllAlertConditions();
            logger.info("[AlertEngine] Alert evaluation cycle completed. Generated {} new alerts.", generatedCount);
        } catch (Exception e) {
            logger.error("[AlertEngine] Error during alert evaluation cycle: {}", e.getMessage(), e);
        }
    }

    /**
     * Evaluates all 5 key alert conditions across database records:
     * 1. High Bill Alert (Actual Bill > Expected Bill × 1.20)
     * 2. Critical Bill Alert (Actual Bill > Expected Bill × 1.50)
     * 3. Water Consumption Threshold (Current Consumption > Configured Threshold)
     * 4. Statistical Anomaly (2-sigma Leak Detection: Usage > μ + 2σ)
     * 5. Tariff Tier Escalation Alert (Tier 1 → Tier 2 → Tier 3)
     */
    public synchronized int evaluateAllAlertConditions() {
        int alertCount = 0;
        alertCount += evaluateBillPriceThresholds();
        alertCount += evaluateWaterConsumptionThresholds();
        alertCount += evaluateStatisticalAnomalyLeaks();
        alertCount += evaluateTariffTierEscalations();
        return alertCount;
    }

    // =========================================================================
    // 1 & 2. HIGH BILL ALERT (> 1.20x) AND CRITICAL BILL ALERT (> 1.50x)
    // =========================================================================
    private int evaluateBillPriceThresholds() {
        int count = 0;
        List<Bill> recentBills = billRepository.findAll();
        if (recentBills.isEmpty()) {
            return 0;
        }

        // Fetch Tariff Plan (Default to building 1 or first plan)
        TariffPlan tariff = tariffRepository.findByBuildingId(1)
                .orElse(new TariffPlan("Tiered Standard Plan", 1, 10.0, 5.0, 20.0, 15.0, 25.0, 150.0, 100.0));

        for (Bill bill : recentBills) {
            Double actualAmount = bill.getTotalAmount();
            Double consumption = bill.getConsumptionKl() != null ? bill.getConsumptionKl() : 0.0;

            // Calculate Expected Tariff Amount formula
            Double expectedVolumetric = calculateExpectedVolumetricCost(consumption, tariff);
            Double baseCharge = tariff.getFixedBaseCharge() != null ? tariff.getFixedBaseCharge() : 150.0;
            Double commonCharge = tariff.getCommonWaterCharge() != null ? tariff.getCommonWaterCharge() : 100.0;
            Double expectedSubtotal = expectedVolumetric + baseCharge + commonCharge;
            Double expectedGst = Math.round(expectedSubtotal * 0.18 * 100.0) / 100.0;
            Double expectedTotal = Math.round((expectedSubtotal + expectedGst) * 100.0) / 100.0;

            if (expectedTotal <= 0) expectedTotal = 100.0;

            Double ratio = actualAmount / expectedTotal;
            Double difference = Math.round((actualAmount - expectedTotal) * 100.0) / 100.0;
            double pctOver = Math.round((ratio - 1.0) * 100.0);

            // Rule 2: Critical Bill Alert (Actual > Expected × 1.50)
            if (ratio >= 1.50) {
                if (!alertRepository.existsByBillIdAndAlertType(bill.getBillId(), "CRITICAL_BILL")) {
                    String alertRef = "ALT-CRIT-BILL-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    Long aptId = bill.getApartmentId();
                    Long userId = findUserIdForApartment(aptId);

                    String title = "Critical Bill Alert: Unusually High Bill";
                    String message = String.format("Critical Bill Alert: Your current bill of ₹%.2f is %.0f%% higher than the expected amount of ₹%.2f.",
                            actualAmount, pctOver, expectedTotal);

                    Alert alert = new Alert(
                            alertRef, aptId, userId, "CRITICAL_BILL", title, message,
                            actualAmount, expectedTotal, expectedTotal * 1.50, difference,
                            "CRITICAL", "ACTIVE", false, bill.getBillId(), null
                    );

                    Alert saved = alertRepository.save(alert);
                    count++;
                    logger.info("[AlertEngine] Created CRITICAL_BILL alert {} for Bill ID {}: Actual ₹{} vs Expected ₹{}",
                            alertRef, bill.getBillId(), actualAmount, expectedTotal);

                    dispatchAlertEmail(saved);
                }
            }
            // Rule 1: High Bill Alert (Actual > Expected × 1.20)
            else if (ratio >= 1.20) {
                if (!alertRepository.existsByBillIdAndAlertType(bill.getBillId(), "HIGH_BILL")) {
                    String alertRef = "ALT-HIGH-BILL-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    Long aptId = bill.getApartmentId();
                    Long userId = findUserIdForApartment(aptId);

                    String title = "High Bill Alert: Exceeds Expected Amount";
                    String message = String.format("High Bill Alert: Your current bill of ₹%.2f is %.0f%% higher than the expected amount of ₹%.2f.",
                            actualAmount, pctOver, expectedTotal);

                    Alert alert = new Alert(
                            alertRef, aptId, userId, "HIGH_BILL", title, message,
                            actualAmount, expectedTotal, expectedTotal * 1.20, difference,
                            "WARNING", "ACTIVE", false, bill.getBillId(), null
                    );

                    Alert saved = alertRepository.save(alert);
                    count++;
                    logger.info("[AlertEngine] Created HIGH_BILL alert {} for Bill ID {}: Actual ₹{} vs Expected ₹{}",
                            alertRef, bill.getBillId(), actualAmount, expectedTotal);

                    dispatchAlertEmail(saved);
                }
            }
        }
        return count;
    }

    // Helper: Calculates expected volumetric tariff cost based on consumption and tariff plan
    private Double calculateExpectedVolumetricCost(Double consumption, TariffPlan tariff) {
        if (consumption == null || consumption <= 0) return 0.0;
        double t1Limit = tariff.getTier1LimitKl() != null ? tariff.getTier1LimitKl() : 10.0;
        double t1Rate  = tariff.getTier1RatePerKl() != null ? tariff.getTier1RatePerKl() : 5.0;
        double t2Limit = tariff.getTier2LimitKl() != null ? tariff.getTier2LimitKl() : 20.0;
        double t2Rate  = tariff.getTier2RatePerKl() != null ? tariff.getTier2RatePerKl() : 15.0;
        double t3Rate  = tariff.getTier3RatePerKl() != null ? tariff.getTier3RatePerKl() : 25.0;

        if (consumption <= t1Limit) {
            return consumption * t1Rate;
        } else if (consumption <= t2Limit) {
            return (t1Limit * t1Rate) + ((consumption - t1Limit) * t2Rate);
        } else {
            return (t1Limit * t1Rate) + ((t2Limit - t1Limit) * t2Rate) + ((consumption - t2Limit) * t3Rate);
        }
    }

    // =========================================================================
    // 2. WATER CONSUMPTION THRESHOLD ALERT ENGINE
    // =========================================================================
    private int evaluateWaterConsumptionThresholds() {
        int count = 0;
        List<WaterUsage> usageLogs = usageRepository.findAll();
        if (usageLogs.isEmpty()) {
            return 0;
        }

        for (WaterUsage usage : usageLogs) {
            if (alertRepository.existsByUsageIdAndAlertType(usage.getUsageId(), "HIGH_CONSUMPTION")) {
                continue;
            }

            Double consumption = usage.getConsumptionKl() != null ? usage.getConsumptionKl() : 0.0;
            Double threshold = config.getConsumptionThresholdKl();

            if (consumption > threshold) {
                Long meterId = usage.getMeterId();
                Long aptId = findApartmentIdForMeter(meterId);
                Long userId = findUserIdForApartment(aptId);

                Double difference = Math.round((consumption - threshold) * 100.0) / 100.0;
                String alertRef = "ALT-CONS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String title = "High Water Consumption Alert";
                String message = String.format("Your water consumption of %.2f KL has exceeded the configured threshold limit of %.2f KL.",
                        consumption, threshold);

                Alert alert = new Alert(
                        alertRef,
                        aptId,
                        userId,
                        "HIGH_CONSUMPTION",
                        title,
                        message,
                        consumption,
                        threshold,
                        threshold,
                        difference,
                        "WARNING",
                        "ACTIVE",
                        false,
                        null,
                        usage.getUsageId()
                );

                Alert saved = alertRepository.save(alert);
                count++;
                logger.info("[AlertEngine] Created HIGH_CONSUMPTION alert {} for Usage ID {}: Consumption {} KL vs Limit {} KL",
                        alertRef, usage.getUsageId(), consumption, threshold);

                dispatchAlertEmail(saved);
            }
        }
        return count;
    }

    // =========================================================================
    // 3. STATISTICAL OUTLIER / 2-SIGMA LEAK DETECTION ENGINE
    // =========================================================================
    private int evaluateStatisticalAnomalyLeaks() {
        int count = 0;
        List<WaterMeter> meters = meterRepository.findAll();
        if (meters.isEmpty()) {
            return 0;
        }

        for (WaterMeter meter : meters) {
            List<WaterUsage> meterLogs = usageRepository.findAll().stream()
                    .filter(u -> Objects.equals(u.getMeterId(), meter.getMeterId()))
                    .sorted(Comparator.comparing(WaterUsage::getRecordedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .toList();

            if (meterLogs.size() < 2) {
                // Need at least 2 readings for statistical standard deviation
                continue;
            }

            WaterUsage latestUsage = meterLogs.get(meterLogs.size() - 1);
            if (alertRepository.existsByUsageIdAndAlertType(latestUsage.getUsageId(), "POTENTIAL_LEAK")) {
                continue;
            }

            // Calculate Historical Baseline Mean (μ) & Standard Deviation (σ) over prior readings
            List<WaterUsage> historicalLogs = meterLogs.size() > 1 ? meterLogs.subList(0, meterLogs.size() - 1) : meterLogs;

            double sum = 0.0;
            for (WaterUsage log : historicalLogs) {
                sum += log.getConsumptionKl() != null ? log.getConsumptionKl() : 0.0;
            }
            double mean = sum / historicalLogs.size();

            double varianceSum = 0.0;
            for (WaterUsage log : historicalLogs) {
                double val = log.getConsumptionKl() != null ? log.getConsumptionKl() : 0.0;
                varianceSum += Math.pow(val - mean, 2);
            }
            double stdDev = Math.sqrt(varianceSum / historicalLogs.size());

            // If stdDev is near 0, set minimum stdDev to 1.0 to avoid division by zero
            if (stdDev < 0.5) {
                stdDev = 1.0;
            }

            double k = config.getSigmaMultiplier() != null ? config.getSigmaMultiplier() : 2.0;
            double leakThresholdLimit = mean + (k * stdDev);

            Double currentVal = latestUsage.getConsumptionKl() != null ? latestUsage.getConsumptionKl() : 0.0;

            // Anomaly condition: Current Usage > Baseline Mean + (2 * StdDev)
            if (currentVal > leakThresholdLimit && currentVal > 5.0) { // Require minimum 5 KL to avoid false alarms
                Long aptId = meter.getApartmentId();
                Long userId = findUserIdForApartment(aptId);

                Double difference = Math.round((currentVal - mean) * 100.0) / 100.0;
                String alertRef = "ALT-LEAK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String title = "Potential Water Leak Alert (Abnormal Consumption)";
                String message = String.format("Your current water usage of %.2f KL is significantly higher than your household average of %.2f KL (Exceeded 2σ limit of %.2f KL). Potential leak detected.",
                        currentVal, mean, leakThresholdLimit);

                Alert alert = new Alert(
                        alertRef,
                        aptId,
                        userId,
                        "POTENTIAL_LEAK",
                        title,
                        message,
                        currentVal,
                        Math.round(mean * 100.0) / 100.0,
                        Math.round(leakThresholdLimit * 100.0) / 100.0,
                        difference,
                        "CRITICAL",
                        "ACTIVE",
                        false,
                        null,
                        latestUsage.getUsageId()
                );

                Alert saved = alertRepository.save(alert);
                count++;
                logger.info("[AlertEngine] Created POTENTIAL_LEAK alert {} for Meter ID {}: Current {} KL > Mean {} KL + 2σ (Limit {} KL)",
                        alertRef, meter.getMeterId(), currentVal, mean, leakThresholdLimit);

                dispatchAlertEmail(saved);
            }
        }
        return count;
    }

    // =========================================================================
    // 5. TARIFF TIER ESCALATION ALERT ENGINE (Tier 1 -> Tier 2 -> Tier 3)
    // =========================================================================
    private int evaluateTariffTierEscalations() {
        int count = 0;

        TariffPlan tariff = tariffRepository.findByBuildingId(1)
                .orElse(new TariffPlan("Tiered Standard Plan", 1, 10.0, 5.0, 20.0, 15.0, 25.0, 150.0, 100.0));

        double t1Limit = tariff.getTier1LimitKl() != null ? tariff.getTier1LimitKl() : 10.0;
        double t2Limit = tariff.getTier2LimitKl() != null ? tariff.getTier2LimitKl() : 20.0;
        double t3Threshold = t2Limit + 10.0; // Level where Tier 3 high usage is significantly exceeded

        List<WaterUsage> usageLogs = usageRepository.findAll();
        List<Bill> recentBills = billRepository.findAll();

        // 1. Evaluate Water Usage Logs
        for (WaterUsage usage : usageLogs) {
            Double consumption = usage.getConsumptionKl() != null ? usage.getConsumptionKl() : 0.0;
            Long meterId = usage.getMeterId();
            Long aptId = findApartmentIdForMeter(meterId);
            Long userId = findUserIdForApartment(aptId);

            count += checkAndCreateTierAlert(consumption, aptId, userId, null, usage.getUsageId(), t1Limit, t2Limit, t3Threshold);
        }

        // 2. Evaluate Generated Bills
        for (Bill bill : recentBills) {
            Double consumption = bill.getConsumptionKl() != null ? bill.getConsumptionKl() : 0.0;
            Long aptId = bill.getApartmentId();
            Long userId = findUserIdForApartment(aptId);

            count += checkAndCreateTierAlert(consumption, aptId, userId, bill.getBillId(), null, t1Limit, t2Limit, t3Threshold);
        }

        return count;
    }

    private int checkAndCreateTierAlert(Double consumption, Long aptId, Long userId, Long billId, Long usageId, double t1Limit, double t2Limit, double t3Threshold) {
        if (consumption == null || consumption <= t1Limit) {
            return 0;
        }

        int created = 0;

        // Tier 1, Tier 2 & Tier 3 Exceeded -> VERY CRITICAL
        if (consumption > t3Threshold) {
            boolean exists = (usageId != null && alertRepository.existsByUsageIdAndAlertType(usageId, "TIER_ESCALATION_TIER3")) ||
                             (billId != null && alertRepository.existsByBillIdAndAlertType(billId, "TIER_ESCALATION_TIER3"));
            if (!exists) {
                String alertRef = "ALT-TIER3-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                String title = "Very Critical Usage Alert: Tier 1, Tier 2 & Tier 3 Exceeded";
                String message = String.format("Very Critical Alert: Your water consumption of %.2f KL has exceeded Tier 1 (%.0f KL), Tier 2 (%.0f KL), and Tier 3 limits.",
                        consumption, t1Limit, t2Limit);

                Alert alert = new Alert(
                        alertRef, aptId, userId, "TIER_ESCALATION_TIER3", title, message,
                        consumption, t2Limit, t2Limit, Math.round((consumption - t2Limit) * 100.0) / 100.0,
                        "VERY CRITICAL", "ACTIVE", false, billId, usageId
                );

                Alert saved = alertRepository.save(alert);
                created++;
                logger.info("[AlertEngine] Created TIER_ESCALATION_TIER3 (VERY CRITICAL) alert {} for Usage {}/Bill {}: {} KL > Tier 3 threshold {} KL",
                        alertRef, usageId, billId, consumption, t3Threshold);

                dispatchAlertEmail(saved);
            }
        }
        // Tier 1 & Tier 2 Exceeded -> CRITICAL
        else if (consumption > t2Limit) {
            boolean exists = (usageId != null && alertRepository.existsByUsageIdAndAlertType(usageId, "TIER_ESCALATION_TIER2")) ||
                             (billId != null && alertRepository.existsByBillIdAndAlertType(billId, "TIER_ESCALATION_TIER2"));
            if (!exists) {
                String alertRef = "ALT-TIER2-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                String title = "Critical Usage Alert: Tier 1 & Tier 2 Exceeded";
                String message = String.format("Critical Usage Alert: Your water consumption of %.2f KL has exceeded Tier 1 (%.0f KL) and Tier 2 (%.0f KL) limits.",
                        consumption, t1Limit, t2Limit);

                Alert alert = new Alert(
                        alertRef, aptId, userId, "TIER_ESCALATION_TIER2", title, message,
                        consumption, t2Limit, t2Limit, Math.round((consumption - t2Limit) * 100.0) / 100.0,
                        "CRITICAL", "ACTIVE", false, billId, usageId
                );

                Alert saved = alertRepository.save(alert);
                created++;
                logger.info("[AlertEngine] Created TIER_ESCALATION_TIER2 (CRITICAL) alert {} for Usage {}/Bill {}: {} KL > Tier 2 limit {} KL",
                        alertRef, usageId, billId, consumption, t2Limit);

                dispatchAlertEmail(saved);
            }
        }
        // Tier 1 Exceeded -> WARNING (Normal Notice)
        else if (consumption > t1Limit) {
            boolean exists = (usageId != null && alertRepository.existsByUsageIdAndAlertType(usageId, "TIER_ESCALATION_TIER1")) ||
                             (billId != null && alertRepository.existsByBillIdAndAlertType(billId, "TIER_ESCALATION_TIER1"));
            if (!exists) {
                String alertRef = "ALT-TIER1-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                String title = "Warning Notice: Tier 1 Limit Exceeded";
                String message = String.format("Warning Notice: Your water consumption of %.2f KL has exceeded the Tier 1 limit of %.0f KL.",
                        consumption, t1Limit);

                Alert alert = new Alert(
                        alertRef, aptId, userId, "TIER_ESCALATION_TIER1", title, message,
                        consumption, t1Limit, t1Limit, Math.round((consumption - t1Limit) * 100.0) / 100.0,
                        "WARNING", "ACTIVE", false, billId, usageId
                );

                Alert saved = alertRepository.save(alert);
                created++;
                logger.info("[AlertEngine] Created TIER_ESCALATION_TIER1 (WARNING) alert {} for Usage {}/Bill {}: {} KL > Tier 1 limit {} KL",
                        alertRef, usageId, billId, consumption, t1Limit);

                dispatchAlertEmail(saved);
            }
        }

        return created;
    }

    // =========================================================================
    // HELPER & EMAIL DISPATCH METHODS
    // =========================================================================
    private void dispatchAlertEmail(Alert alert) {
        if (!Boolean.TRUE.equals(config.getEnableEmailAlerts())) {
            return;
        }

        try {
            Long userId = alert.getUserId();
            String email = null;
            String name = "Resident";

            if (userId != null) {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    email = userOpt.get().getEmail();
                    name = userOpt.get().getFullName();
                }
            }

            if (email == null && alert.getApartmentId() != null) {
                Optional<Apartment> aptOpt = apartmentRepository.findById(alert.getApartmentId());
                if (aptOpt.isPresent() && aptOpt.get().getResidentUserId() != null) {
                    Optional<User> uOpt = userRepository.findById(aptOpt.get().getResidentUserId());
                    if (uOpt.isPresent()) {
                        email = uOpt.get().getEmail();
                        name = uOpt.get().getFullName();
                    }
                }
            }

            if (email != null && !email.trim().isEmpty()) {
                String dateTimeStr = alert.getCreatedAt() != null
                        ? alert.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                        : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));

                emailService.sendAlertNotificationEmail(
                        email,
                        name,
                        alert.getAlertType(),
                        alert.getTitle(),
                        alert.getMessage(),
                        alert.getCurrentValue(),
                        alert.getExpectedValue(),
                        alert.getDifferenceValue(),
                        alert.getSeverity(),
                        dateTimeStr
                );
            }
        } catch (Exception e) {
            logger.warn("[AlertEngine] Could not dispatch alert email: {}", e.getMessage());
        }
    }

    private Long findUserIdForApartment(Long apartmentId) {
        if (apartmentId == null) return null;
        return apartmentRepository.findById(apartmentId)
                .map(Apartment::getResidentUserId)
                .orElse(null);
    }

    private Long findApartmentIdForMeter(Long meterId) {
        if (meterId == null) return null;
        return meterRepository.findById(meterId)
                .map(WaterMeter::getApartmentId)
                .orElse(null);
    }
}
