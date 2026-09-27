package com.watermonitoring.service.chat.context;

import com.watermonitoring.entity.*;
import com.watermonitoring.repository.*;
import com.watermonitoring.service.ResidentComparisonService;
import com.watermonitoring.service.ResidentDashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * ResidentContextProvider — Assembles authorized personal data strictly scoped
 * to the authenticated resident's account, apartment, meter, and bills.
 * Must NEVER include other residents' private information.
 */
@Component
public class ResidentContextProvider {

    private static final Logger log = LoggerFactory.getLogger(ResidentContextProvider.class);

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository waterMeterRepository;
    private final BillRepository billRepository;
    private final AlertRepository alertRepository;
    private final WaterUsageRepository waterUsageRepository;
    private final ResidentDashboardService dashboardService;
    private final ResidentComparisonService comparisonService;

    @Autowired
    public ResidentContextProvider(UserRepository userRepository,
                                   ApartmentRepository apartmentRepository,
                                   WaterMeterRepository waterMeterRepository,
                                   BillRepository billRepository,
                                   AlertRepository alertRepository,
                                   WaterUsageRepository waterUsageRepository,
                                   ResidentDashboardService dashboardService,
                                   ResidentComparisonService comparisonService) {
        this.userRepository = userRepository;
        this.apartmentRepository = apartmentRepository;
        this.waterMeterRepository = waterMeterRepository;
        this.billRepository = billRepository;
        this.alertRepository = alertRepository;
        this.waterUsageRepository = waterUsageRepository;
        this.dashboardService = dashboardService;
        this.comparisonService = comparisonService;
    }

    public String buildContext(String residentEmail) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== RESIDENT PERSONAL ACCOUNT CONTEXT ===\n");
        sb.append("Authenticated Resident: ").append(residentEmail).append("\n");
        sb.append("Role: RESIDENT (Personal authorized view only)\n\n");

        try {
            Optional<User> userOpt = userRepository.findByEmail(residentEmail);
            String fullName = userOpt.map(User::getFullName).orElse("Resident User");
            sb.append("Resident Name: ").append(fullName).append("\n");

            // Look up the apartment actually assigned to this resident. If
            // none is linked (e.g. a demo/test login), fall back to
            // whatever apartment exists in the seed data rather than a
            // hardcoded number — the seeded demo unit isn't guaranteed to
            // be any particular apartment number.
            Apartment apt = dashboardService.resolveApartment(residentEmail);

            if (apt != null) {
                sb.append("• Apartment Number: ").append(apt.getApartmentNumber()).append("\n");
                sb.append("• Building: ").append(apt.getBuildingName()).append("\n");
                sb.append("• Floor: ").append(apt.getFloorNumber()).append("\n");

                // Meter lookup
                WaterMeter meter = null;
                Optional<WaterMeter> meterOpt = waterMeterRepository.findByApartmentId(apt.getApartmentId());
                if (meterOpt.isPresent()) {
                    meter = meterOpt.get();
                    sb.append("• Water Meter Serial: ").append(meter.getSerialNumber()).append("\n");
                    sb.append("• Meter Status: ").append(meter.getStatus()).append("\n");
                    sb.append("• Battery Level: ").append(meter.getBatteryPercentage()).append("%\n");
                    sb.append("• Signal Strength: ").append(meter.getSignalStrength()).append("%\n");
                }

                // Full billing history for this apartment (not just the latest —
                // the resident may be on the Billing History page and ask about
                // any past bill, not only the current one).
                List<Bill> bills = billRepository.findByApartmentId(apt.getApartmentId());
                if (bills.isEmpty()) {
                    sb.append("• Billing Status: All clear — No pending bills. Current balance is ₹0.00.\n");
                } else {
                    List<Bill> billsNewestFirst = bills.stream()
                            .sorted(Comparator.comparing(Bill::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                            .toList();
                    Bill latestBill = billsNewestFirst.get(0);
                    sb.append("• Current / Latest Bill: ").append(latestBill.getBillNumber())
                      .append(", ₹").append(latestBill.getTotalAmount())
                      .append(", Status: ").append(latestBill.getStatus());
                    if (latestBill.getDueDate() != null) {
                        sb.append(", Due: ").append(latestBill.getDueDate());
                    }
                    sb.append("\n");

                    sb.append("• Full Billing History (").append(billsNewestFirst.size()).append(" bill(s), newest first):\n");
                    for (Bill b : billsNewestFirst) {
                        sb.append("   - ").append(b.getBillNumber())
                          .append(" | ").append(b.getBillingMonth() != null ? b.getBillingMonth() : "N/A")
                          .append(" | Amount: ₹").append(b.getTotalAmount())
                          .append(" | Consumption: ").append(b.getConsumptionKl() != null ? b.getConsumptionKl() : "N/A").append(" kL")
                          .append(" | Status: ").append(b.getStatus())
                          .append(" | Due: ").append(b.getDueDate() != null ? b.getDueDate() : "N/A")
                          .append("\n");
                    }
                }

                // Recent water usage / meter reading history (relevant to the
                // Water Consumption and Usage History pages).
                if (meter != null) {
                    List<WaterUsage> usageHistory = waterUsageRepository.findByMeterId(meter.getMeterId());
                    if (!usageHistory.isEmpty()) {
                        List<WaterUsage> recentUsage = usageHistory.stream()
                                .sorted(Comparator.comparing(WaterUsage::getReadingDate, Comparator.nullsLast(Comparator.reverseOrder())))
                                .limit(15)
                                .toList();
                        sb.append("• Recent Water Usage History (last ").append(recentUsage.size())
                          .append(" of ").append(usageHistory.size()).append(" readings, newest first):\n");
                        for (WaterUsage u : recentUsage) {
                            sb.append("   - ").append(u.getReadingDate())
                              .append(": ").append(u.getConsumptionKl()).append(" kL")
                              .append(" (meter reading ").append(u.getPreviousReading()).append(" → ").append(u.getCurrentReading()).append(")")
                              .append("\n");
                        }
                    }
                }

                // Alerts for this apartment only
                List<Alert> alerts = alertRepository.findByApartmentIdOrderByCreatedAtDesc(apt.getApartmentId());
                List<Alert> activeAlerts = alerts.stream()
                        .filter(a -> "ACTIVE".equals(a.getStatus()))
                        .toList();
                sb.append("• Active Alerts (").append(activeAlerts.size()).append("):\n");
                if (activeAlerts.isEmpty()) {
                    sb.append("   - None. System operating normally.\n");
                } else {
                    activeAlerts.forEach(a -> sb.append("   - [").append(a.getSeverity()).append("] ").append(a.getTitle()).append("\n"));
                }
            } else {
                sb.append("Notice: This account is not linked to a household yet, so there is no meter, usage or billing data to show. Ask the community admin to link it.\n");
            }

            appendDashboardFigures(sb, residentEmail);

        } catch (Exception e) {
            log.warn("Could not load resident context: {}", e.getMessage());
            sb.append("Notice: Personal metrics are temporarily being synchronized.\n");
        }

        sb.append("\nSTRICT RESIDENT PRIVACY RULES:\n");
        sb.append("- You represent and serve ONLY this resident.\n");
        sb.append("- You do NOT have access to other apartments or other residents' bills/meters.\n");
        sb.append("- If asked about other residents or system-wide data, politely state that you cannot access other users' private information.\n");

        return sb.toString();
    }

    /** The same numbers the resident dashboard and Consumption Comparison page display. */
    private void appendDashboardFigures(StringBuilder sb, String email) {
        try {
            ResidentDashboardService.Dashboard d = dashboardService.build(email);
            if (d.apartment() == null) return;
            ResidentDashboardService.Kpis k = d.kpis();
            sb.append("\nDASHBOARD FIGURES (as shown on the resident dashboard)\n");
            sb.append("- Month to date: ").append(k.monthToDateKl()).append(" kL; previous month (same days): ").append(k.previousMonthKl())
              .append(" kL; change vs previous month: ").append(k.changeVsPreviousPct() == null ? "n/a" : k.changeVsPreviousPct() + "%").append("\n");
            sb.append("- Daily average over the last 30 days: ").append(k.avgDailyKl30()).append(" kL; latest day: ").append(k.latestDayKl()).append(" kL\n");
            sb.append("- Outstanding to pay: Rs ").append(k.outstandingTotal()).append(" across ").append(k.pendingBills()).append(" pending bill(s)\n");
            if (d.monthly() != null && !d.monthly().isEmpty())
                sb.append("- Monthly consumption (kL, oldest first): ").append(d.monthly().stream()
                        .map(m -> m.label() + " " + m.consumptionKl()).collect(java.util.stream.Collectors.joining(", "))).append("\n");
            if (d.tips() != null && !d.tips().isEmpty())
                sb.append("- Water-saving tips shown: ").append(d.tips().stream().limit(4).map(ResidentDashboardService.Tip::title)
                        .collect(java.util.stream.Collectors.joining("; "))).append("\n");

            ResidentComparisonService.Comparison c = comparisonService.build(email);
            if (c.peerGroup() != null && !c.peerGroup().communityAvailable()) {
                sb.append("- Community comparison: NOT available yet. It needs at least ").append(c.peerGroup().minGroupSize())
                  .append(" households with readings so the average stays anonymous. Say this plainly; do not mention null values.\n");
            } else if (c.monthToDate() != null) {
                ResidentComparisonService.Summary s = c.monthToDate();
                sb.append("- Comparison this month so far: you ").append(s.youKl()).append(" kL vs community average ").append(s.communityAvgKl())
                  .append(" kL (").append(s.pctVsCommunity() == null ? "n/a" : s.pctVsCommunity() + "%").append(")");
                if (s.peerAvgKl() != null) sb.append(", vs similar households in your building ").append(s.peerAvgKl()).append(" kL");
                sb.append("\n");
            }
            if (c.insights() != null)
                c.insights().stream().limit(3).forEach(i -> sb.append("- Insight: ").append(i.title()).append(" - ").append(i.body()).append("\n"));
            sb.append("(Comparison figures are anonymous averages; you cannot see other households' names or bills.)\n");
        } catch (Exception e) {
            log.warn("Dashboard figures unavailable for resident chat context: {}", e.getMessage());
        }
    }
}
