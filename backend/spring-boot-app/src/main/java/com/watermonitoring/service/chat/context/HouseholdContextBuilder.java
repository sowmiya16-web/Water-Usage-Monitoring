package com.watermonitoring.service.chat.context;

import com.watermonitoring.service.CommunityAdminService;
import com.watermonitoring.service.HouseholdService;
import com.watermonitoring.service.HouseholdService.HouseholdRow;
import com.watermonitoring.service.HouseholdService.ResidentRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * HouseholdContextBuilder — turns the same live data the Community Admin dashboards show
 * (households, residents, meters, monthly usage history, comparisons, billing) into a compact
 * text block for the chatbot. Bounded in size: full detail for the MAX_DETAILED highest-usage
 * households, aggregate figures for the rest, so it stays fast with many households.
 */
@Component
public class HouseholdContextBuilder {

    private static final Logger log = LoggerFactory.getLogger(HouseholdContextBuilder.class);
    private static final int MAX_DETAILED = 40;
    private static final int HISTORY_MONTHS = 6;

    private final HouseholdService householdService;
    private final CommunityAdminService communityAdminService;

    @Autowired
    public HouseholdContextBuilder(HouseholdService householdService, CommunityAdminService communityAdminService) {
        this.householdService = householdService;
        this.communityAdminService = communityAdminService;
    }

    public String build() {
        StringBuilder sb = new StringBuilder();
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.from(today);
        sb.append("=== LIVE COMMUNITY WATER DATA (same figures as the Community Admin dashboards) ===\n");
        sb.append("Today: ").append(today).append(". Current month: ").append(ym).append(" (day ").append(today.getDayOfMonth())
          .append("). 'Previous' means last month over the same days of the month.\n\n");

        try {
            List<HouseholdRow> all = householdService.snapshot(ym.toString());
            Map<Long, Map<YearMonth, Double>> history = householdService.monthlyByMeter(HISTORY_MONTHS);

            long occupied = all.stream().filter(h -> "OCCUPIED".equalsIgnoreCase(h.occupancyStatus())).count();
            long withMeter = all.stream().filter(h -> h.meter() != null).count();
            long online = all.stream().filter(h -> h.meter() != null && "ONLINE".equalsIgnoreCase(h.meter().status())).count();
            double total = all.stream().mapToDouble(HouseholdRow::currentKl).sum();
            double avg = all.isEmpty() ? 0 : total / all.size();
            long reporting = all.stream().filter(h -> h.readingDays() > 0).count();
            int residents = all.stream().mapToInt(h -> h.residents().size()).sum();

            sb.append("COMMUNITY SUMMARY\n");
            sb.append("- Households: ").append(all.size()).append(" (occupied ").append(occupied).append(", vacant ")
              .append(all.size() - occupied).append("); registered residents: ").append(residents).append("\n");
            sb.append("- Water meters: ").append(withMeter).append(" (online ").append(online).append(", offline/alert ")
              .append(withMeter - online).append("); households without a meter: ").append(all.size() - withMeter).append("\n");
            Map<String, Long> byBuilding = all.stream().collect(Collectors.groupingBy(
                    h -> h.buildingName() == null ? "Unassigned" : h.buildingName(), TreeMap::new, Collectors.counting()));
            sb.append("- Buildings: ").append(byBuilding.entrySet().stream().map(e -> e.getKey() + " (" + e.getValue() + " households)")
                    .collect(Collectors.joining("; "))).append("\n");
            sb.append("- Consumption this month so far: ").append(fmt(total)).append(" KL across ").append(reporting)
              .append(" households with readings; average per household ").append(fmt(avg)).append(" KL\n");
            List<HouseholdRow> high = all.stream().filter(h -> avg > 0 && h.currentKl() > avg * 1.5)
                    .sorted(Comparator.comparingDouble(HouseholdRow::currentKl).reversed()).toList();
            sb.append("- High users (over 1.5x the average): ")
              .append(high.isEmpty() ? "none" : high.stream().map(h -> label(h) + " " + fmt(h.currentKl()) + " KL").collect(Collectors.joining(", ")))
              .append("\n");
            List<HouseholdRow> silent = all.stream().filter(h -> h.meter() != null && h.readingDays() == 0).toList();
            if (!silent.isEmpty())
                sb.append("- Households with a meter but NO readings this month: ")
                  .append(silent.stream().map(HouseholdContextBuilder::label).limit(15).collect(Collectors.joining(", ")))
                  .append(silent.size() > 15 ? " and " + (silent.size() - 15) + " more" : "").append("\n");
            appendBilling(sb);

            sb.append("\nHOUSEHOLDS (this month vs previous; history = monthly KL for the last ").append(HISTORY_MONTHS)
              .append(" months, oldest first: ").append(monthLabels(ym)).append(")\n");
            List<HouseholdRow> ordered = all.stream()
                    .sorted(Comparator.comparingDouble(HouseholdRow::currentKl).reversed().thenComparing(HouseholdRow::apartmentNumber))
                    .toList();
            int rank = 0;
            for (HouseholdRow h : ordered.stream().limit(MAX_DETAILED).toList()) {
                rank++;
                sb.append("- ").append(label(h)).append(" | floor ").append(h.floorNumber()).append(" | ").append(h.occupancyStatus());
                sb.append(" | residents: ").append(h.residents().isEmpty() ? "none registered"
                        : h.residents().stream().map(HouseholdContextBuilder::person).collect(Collectors.joining("; ")));
                if (h.meter() == null) sb.append(" | meter: none");
                else sb.append(" | meter ").append(h.meter().serialNumber()).append(" ").append(h.meter().status())
                       .append(h.meter().lastReadingDate() != null ? ", last reading " + h.meter().lastReadingDate() : ", no readings yet");
                sb.append(" | this month ").append(fmt(h.currentKl())).append(" KL (").append(h.readingDays()).append(" reading days, share ")
                  .append(fmt(h.sharePct())).append("%, usage rank ").append(rank).append(" of ").append(all.size()).append(")");
                sb.append(" | previous ").append(fmt(h.previousKl())).append(" KL");
                if (h.changePct() != null) sb.append(" (").append(h.changePct() > 0 ? "up " : "down ").append(fmt(Math.abs(h.changePct()))).append("%)");
                if (avg > 0 && h.currentKl() > 0)
                    sb.append(" | vs community average ").append(h.currentKl() >= avg ? "+" : "").append(fmt((h.currentKl() - avg) * 100 / avg)).append("%");
                sb.append(" | pending bills ").append(h.pendingBills());
                if (h.pendingBills() > 0) sb.append(" (Rs ").append(fmt(h.pendingAmount())).append(")");
                if (h.meter() != null) sb.append(" | history: ").append(historyOf(history.get(h.meter().meterId()), ym));
                sb.append("\n");
            }
            if (ordered.size() > MAX_DETAILED)
                sb.append("- ...and ").append(ordered.size() - MAX_DETAILED).append(" more lower-usage households not listed here (their usage is included in the totals above). ")
                  .append("If asked about one of them, say it is not in this summary and point to Water Management > Households.\n");
            if (all.isEmpty()) sb.append("- No households are registered yet.\n");
        } catch (Exception e) {
            log.warn("Could not build household context: {}", e.getMessage());
            sb.append("Notice: household figures are temporarily unavailable.\n");
        }

        sb.append("\nRULES FOR USING THIS DATA\n");
        sb.append("- Answer household, resident, meter, usage-history, comparison and billing questions ONLY from the data above; never invent numbers, names or dates.\n");
        sb.append("- A month with 0 in a household's history means no readings were recorded for it.\n");
        sb.append("- For 'which household uses the most/least', 'compare A and B', 'who is above average', 'how many households/residents' use the figures above.\n");
        sb.append("- HOW TO (Household Management): open Water Management > Households.\n");
        sb.append("  * Add a household: click '+ Add household', enter unit number, building, floor and occupancy; optionally a meter serial (auto-generated if blank), an initial meter reading and the first resident (name, email, phone); click 'Add household'. The first resident also gets a portal login.\n");
        sb.append("  * Edit: click 'Edit' on the household row (unit, building, floor, occupancy, meter serial/status). Delete: click 'Delete' - not allowed if the household has bills; mark it Vacant instead.\n");
        sb.append("  * Open a household (click its unit number) for residents (add/edit/remove), meter, a 6/12/24-month usage history chart and table, recent readings, comparison with the community average, bills, and to add a meter reading.\n");
        sb.append("  * Only the primary resident has a portal login; extra residents are stored as household members.\n");
        return sb.toString();
    }

    private void appendBilling(StringBuilder sb) {
        try {
            CommunityAdminService.Dashboard d = communityAdminService.dashboard();
            CommunityAdminService.Kpis k = d.kpis();
            sb.append("- Billing: collected Rs ").append(fmt(k.collected())).append(", outstanding Rs ").append(fmt(k.outstanding()))
              .append(" (").append(k.paidBills()).append(" paid, ").append(k.pendingBills()).append(" pending bills; collection rate ")
              .append(fmt(k.collectionRatePct())).append("%)\n");
            if (d.activeCycle() != null)
                sb.append("- Active billing cycle: ").append(d.activeCycle().name()).append(" (").append(d.activeCycle().startDate())
                  .append(" to ").append(d.activeCycle().endDate()).append(")\n");
            if (d.tariff() != null)
                sb.append("- Current tariff: ").append(d.tariff().getPlanName()).append(" v").append(d.tariff().getVersion())
                  .append(" - first ").append(d.tariff().getTier1LimitKl()).append(" KL at Rs ").append(d.tariff().getTier1RatePerKl())
                  .append("/KL, up to ").append(d.tariff().getTier2LimitKl()).append(" KL at Rs ").append(d.tariff().getTier2RatePerKl())
                  .append("/KL, above that Rs ").append(d.tariff().getTier3RatePerKl()).append("/KL; base charge Rs ")
                  .append(d.tariff().getFixedBaseCharge()).append(", common water charge Rs ").append(d.tariff().getCommonWaterCharge()).append("\n");
            sb.append("- Bulk water purchased this month: ").append(fmt(k.purchasedKlThisMonth())).append(" KL\n");
            if (d.alerts() != null && !d.alerts().isEmpty())
                sb.append("- Recent alerts: ").append(d.alerts().stream().limit(5)
                        .map(a -> "[" + a.severity() + "] " + a.title() + (a.apartment() != null ? " (" + a.apartment() + ")" : ""))
                        .collect(Collectors.joining("; "))).append("\n");
        } catch (Exception e) {
            log.warn("Billing summary unavailable for chat context: {}", e.getMessage());
        }
    }

    private static String label(HouseholdRow h) {
        return h.apartmentNumber() + " (" + h.buildingName() + ")";
    }

    private static String person(ResidentRow r) {
        return r.fullName() + " <" + r.email() + ">" + (r.primary() ? " [primary, portal login]" : r.hasLogin() ? " [portal login]" : "");
    }

    private static String monthLabels(YearMonth ym) {
        List<String> l = new ArrayList<>();
        for (int i = HISTORY_MONTHS - 1; i >= 0; i--) l.add(ym.minusMonths(i).toString());
        return String.join(", ", l);
    }

    private static String historyOf(Map<YearMonth, Double> m, YearMonth ym) {
        List<String> l = new ArrayList<>();
        for (int i = HISTORY_MONTHS - 1; i >= 0; i--) l.add(fmt(m == null ? 0 : m.getOrDefault(ym.minusMonths(i), 0.0)));
        return String.join(" / ", l) + " KL";
    }

    private static String fmt(double v) {
        return v == Math.floor(v) ? String.valueOf((long) v) : String.format(Locale.ROOT, "%.2f", v);
    }
}
