package com.watermonitoring.service;

import com.watermonitoring.entity.*;
import com.watermonitoring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

/**
 * ResidentDashboardService — Assembles everything the Resident Dashboard
 * needs in one call: consumption trends (daily + monthly), the current
 * billing-cycle summary, billing/invoice history (with PDF invoice ids),
 * the alerts feed, and water-saving tips.
 */
@Service
public class ResidentDashboardService {

    private static final DateTimeFormatter BILL_MONTH = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;
    private final BillRepository billRepository;
    private final InvoiceRepository invoiceRepository;
    private final AlertRepository alertRepository;
    private final TariffPlanRepository tariffRepository;

    @Autowired
    public ResidentDashboardService(UserRepository userRepository, ApartmentRepository apartmentRepository,
                                    WaterMeterRepository meterRepository, WaterUsageRepository usageRepository,
                                    BillRepository billRepository, InvoiceRepository invoiceRepository,
                                    AlertRepository alertRepository, TariffPlanRepository tariffRepository) {
        this.userRepository = userRepository;
        this.apartmentRepository = apartmentRepository;
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
        this.billRepository = billRepository;
        this.invoiceRepository = invoiceRepository;
        this.alertRepository = alertRepository;
        this.tariffRepository = tariffRepository;
    }

    // ── Response shapes ──────────────────────────────────────────────
    public record DailyPoint(String date, String label, Double consumptionKl) {}
    public record MonthlyPoint(String month, String label, Double consumptionKl) {}
    public record CurrentBill(Long billId, String billNumber, String billingMonth, Double amountDue,
                              Double totalAmount, Double consumptionKl, LocalDate dueDate, String status,
                              Long daysUntilDue) {}
    public record InvoiceRow(Long billId, String billNumber, String billingMonth, Double totalAmount,
                             Double consumptionKl, LocalDate dueDate, String status, Long invoiceId) {}
    public record AlertRow(Long alertId, String type, String title, String message, String severity,
                           String status, boolean acknowledged, String createdAt) {}
    public record Tip(String title, String body, String priority) {}
    public record Kpis(Double latestDayKl, Double avgDailyKl30, Double monthToDateKl, Double previousMonthKl,
                       Double changeVsPreviousPct, Double outstandingTotal, int pendingBills) {}
    public record Dashboard(String apartment, String building, String meterSerial, String meterStatus,
                            List<DailyPoint> daily, List<MonthlyPoint> monthly, Kpis kpis,
                            CurrentBill currentBill, List<InvoiceRow> invoices, List<AlertRow> alerts,
                            List<Tip> tips, boolean usingBillHistoryForTrend) {}

    @Transactional(readOnly = true)
    public Dashboard build(String email) {
        Apartment apt = resolveApartment(email);
        if (apt == null) {
            return new Dashboard(null, null, null, null, List.of(), List.of(), new Kpis(null, null, null, null, null, 0.0, 0),
                    null, List.of(), List.of(), generalTips(List.of()), false);
        }

        Optional<WaterMeter> meterOpt = meterRepository.findByApartmentId(apt.getApartmentId());
        List<WaterUsage> usage = meterOpt.map(m -> usageRepository.findByMeterId(m.getMeterId())).orElse(List.of())
                .stream().filter(u -> u.getReadingDate() != null && u.getConsumptionKl() != null)
                .sorted(Comparator.comparing(WaterUsage::getReadingDate)).toList();

        List<Bill> bills = billRepository.findByApartmentId(apt.getApartmentId()).stream()
                .sorted(Comparator.comparing(Bill::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))).toList();
        List<Bill> liveBills = bills.stream().filter(b -> !"SUPERSEDED".equalsIgnoreCase(b.getStatus())).toList();

        LocalDate today = LocalDate.now();
        List<DailyPoint> daily = dailySeries(usage, today);
        boolean fallback = usage.isEmpty();
        List<MonthlyPoint> monthly = fallback ? monthlyFromBills(liveBills) : monthlySeries(usage, today);

        Kpis kpis = kpis(usage, liveBills, today);
        CurrentBill current = currentBill(liveBills, today);

        List<InvoiceRow> invoices = bills.stream().limit(12).map(b -> new InvoiceRow(
                b.getBillId(), b.getBillNumber(), b.getBillingMonth(), b.getTotalAmount(), b.getConsumptionKl(),
                b.getDueDate(), b.getStatus(),
                "PAID".equalsIgnoreCase(b.getStatus())
                        ? invoiceRepository.findTopByBillIdOrderByGeneratedAtDesc(b.getBillId()).map(Invoice::getInvoiceId).orElse(null)
                        : null)).toList();

        List<AlertRow> alerts = alertRepository.findByApartmentIdOrderByCreatedAtDesc(apt.getApartmentId()).stream()
                .limit(8).map(a -> new AlertRow(a.getAlertId(), a.getAlertType(), a.getTitle(), a.getMessage(),
                        a.getSeverity(), a.getStatus(), Boolean.TRUE.equals(a.getAcknowledged()),
                        a.getCreatedAt() != null ? a.getCreatedAt().toString() : null)).toList();

        return new Dashboard(apt.getApartmentNumber(), apt.getBuildingName(),
                meterOpt.map(WaterMeter::getSerialNumber).orElse(null), meterOpt.map(WaterMeter::getStatus).orElse(null),
                daily, monthly, kpis, current, invoices, alerts, tips(usage, kpis, today), fallback);
    }

    /**
     * The signed-in resident's own apartment. A registered account that is not linked to a household gets
     * none (never someone else's data); only the built-in demo login, which has no database account, is
     * shown the first apartment.
     */
    public Apartment resolveApartment(String email) {
        if (email != null) {
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent())
                return apartmentRepository.findByResidentUserId(user.get().getUserId()).orElse(null);
        }
        return apartmentRepository.findAll().stream().min(Comparator.comparing(Apartment::getApartmentId)).orElse(null);
    }

    private List<DailyPoint> dailySeries(List<WaterUsage> usage, LocalDate today) {
        Map<LocalDate, Double> byDay = new HashMap<>();
        for (WaterUsage u : usage) byDay.merge(u.getReadingDate(), u.getConsumptionKl(), Double::sum);
        List<DailyPoint> out = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            Double v = byDay.get(d);
            out.add(new DailyPoint(d.toString(), d.getDayOfMonth() + " " + d.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    v == null ? null : round(v)));
        }
        return out;
    }

    private List<MonthlyPoint> monthlySeries(List<WaterUsage> usage, LocalDate today) {
        Map<YearMonth, Double> byMonth = new TreeMap<>();
        for (WaterUsage u : usage) byMonth.merge(YearMonth.from(u.getReadingDate()), u.getConsumptionKl(), Double::sum);
        YearMonth from = YearMonth.from(today).minusMonths(5);
        List<MonthlyPoint> out = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            YearMonth ym = from.plusMonths(i);
            Double v = byMonth.get(ym);
            out.add(new MonthlyPoint(ym.toString(), ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear(),
                    v == null ? null : round(v)));
        }
        return out;
    }

    /** No meter readings yet — chart what was actually billed instead. */
    private List<MonthlyPoint> monthlyFromBills(List<Bill> liveBills) {
        Map<YearMonth, Double> byMonth = new TreeMap<>();
        for (Bill b : liveBills) {
            try {
                YearMonth ym = YearMonth.parse(b.getBillingMonth(), BILL_MONTH);
                byMonth.merge(ym, b.getConsumptionKl() == null ? 0.0 : b.getConsumptionKl(), Math::max);
            } catch (Exception ignored) { /* unparsable month label — skip */ }
        }
        List<MonthlyPoint> out = new ArrayList<>();
        byMonth.forEach((ym, v) -> out.add(new MonthlyPoint(ym.toString(),
                ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear(), round(v))));
        return out.size() > 6 ? out.subList(out.size() - 6, out.size()) : out;
    }

    private Kpis kpis(List<WaterUsage> usage, List<Bill> liveBills, LocalDate today) {
        Double latest = usage.isEmpty() ? null : round(usage.get(usage.size() - 1).getConsumptionKl());
        double last30 = usage.stream().filter(u -> !u.getReadingDate().isBefore(today.minusDays(29))).mapToDouble(WaterUsage::getConsumptionKl).sum();
        long days30 = usage.stream().filter(u -> !u.getReadingDate().isBefore(today.minusDays(29))).map(WaterUsage::getReadingDate).distinct().count();
        YearMonth thisMonth = YearMonth.from(today), prevMonth = thisMonth.minusMonths(1);
        double mtd = usage.stream().filter(u -> YearMonth.from(u.getReadingDate()).equals(thisMonth)).mapToDouble(WaterUsage::getConsumptionKl).sum();
        double prev = usage.stream().filter(u -> YearMonth.from(u.getReadingDate()).equals(prevMonth)).mapToDouble(WaterUsage::getConsumptionKl).sum();
        // Compare like-for-like: this month so far vs the same number of days last month.
        double prevSamePeriod = usage.stream().filter(u -> YearMonth.from(u.getReadingDate()).equals(prevMonth)
                && u.getReadingDate().getDayOfMonth() <= today.getDayOfMonth()).mapToDouble(WaterUsage::getConsumptionKl).sum();
        Double change = prevSamePeriod > 0 ? round((mtd - prevSamePeriod) / prevSamePeriod * 100.0) : null;
        List<Bill> pending = liveBills.stream().filter(b -> "PENDING".equalsIgnoreCase(b.getStatus())).toList();
        return new Kpis(latest, days30 > 0 ? round(last30 / days30) : null, usage.isEmpty() ? null : round(mtd),
                usage.isEmpty() ? null : round(prev), change,
                round(pending.stream().mapToDouble(b -> b.getTotalAmount() == null ? 0 : b.getTotalAmount()).sum()), pending.size());
    }

    private CurrentBill currentBill(List<Bill> liveBills, LocalDate today) {
        if (liveBills.isEmpty()) return null;
        // The bill the resident needs to act on: the oldest unpaid one (bills must be paid in order);
        // otherwise the most recent bill.
        Bill b = liveBills.stream().filter(x -> "PENDING".equalsIgnoreCase(x.getStatus()))
                .min(Comparator.comparing(Bill::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(liveBills.get(0));
        boolean pending = "PENDING".equalsIgnoreCase(b.getStatus());
        Long days = b.getDueDate() == null ? null : java.time.temporal.ChronoUnit.DAYS.between(today, b.getDueDate());
        return new CurrentBill(b.getBillId(), b.getBillNumber(), b.getBillingMonth(), pending ? b.getTotalAmount() : 0.0,
                b.getTotalAmount(), b.getConsumptionKl(), b.getDueDate(), b.getStatus(), days);
    }

    // ── Water-saving tips ────────────────────────────────────────────
    private List<Tip> tips(List<WaterUsage> usage, Kpis k, LocalDate today) {
        List<Tip> contextual = new ArrayList<>();

        if (k.changeVsPreviousPct() != null && k.changeVsPreviousPct() >= 15) {
            contextual.add(new Tip("Usage is up " + Math.round(k.changeVsPreviousPct()) + "% vs last month",
                    "Check for a running toilet or dripping tap — add a few drops of food colouring to the cistern; if colour reaches the bowl without flushing, it's leaking.",
                    "high"));
        } else if (k.changeVsPreviousPct() != null && k.changeVsPreviousPct() <= -10) {
            contextual.add(new Tip("Nice — usage is down " + Math.round(-k.changeVsPreviousPct()) + "% vs last month",
                    "Whatever you changed is working. Keep it up to stay in a lower tariff tier.", "good"));
        }

        tariffRepository.findByBuildingId(1).ifPresent(t -> {
            if (k.monthToDateKl() != null && today.getDayOfMonth() >= 5) {
                double projected = k.monthToDateKl() / today.getDayOfMonth() * today.lengthOfMonth();
                if (t.getTier2LimitKl() != null && projected > t.getTier2LimitKl()) {
                    contextual.add(new Tip("On track for Tier 3 pricing (" + Math.round(projected) + " KL projected)",
                            "You're projected above " + Math.round(t.getTier2LimitKl()) + " KL this month, where each extra KL costs ₹" + t.getTier3RatePerKl()
                                    + ". Cutting ~" + Math.round(projected - t.getTier2LimitKl() + 1) + " KL brings you back to Tier 2.", "high"));
                } else if (t.getTier1LimitKl() != null && projected > t.getTier1LimitKl()) {
                    contextual.add(new Tip("Projected " + Math.round(projected) + " KL this month",
                            "Usage above " + Math.round(t.getTier1LimitKl()) + " KL is billed at the higher Tier 2 rate of ₹" + t.getTier2RatePerKl() + "/KL.", "medium"));
                }
            }
        });

        return generalTips(contextual);
    }

    private static final List<Tip> GENERAL = List.of(
            new Tip("Fix leaks early", "A tap dripping once a second wastes ~10,000 litres a year. Tighten or replace the washer.", "info"),
            new Tip("Shorter showers", "Cutting a shower by 2 minutes saves up to 20 litres each time.", "info"),
            new Tip("Turn off the tap", "Switch the tap off while brushing or shaving — it saves ~6 litres per minute.", "info"),
            new Tip("Run full loads only", "Wash clothes and dishes only with a full load to save water and power.", "info"),
            new Tip("Water plants at dawn", "Watering early or late in the day reduces evaporation loss.", "info"),
            new Tip("Reuse RO reject water", "Collect RO reject water for mopping floors, flushing or watering plants.", "info"),
            new Tip("Use a bucket, not a hose", "Washing a car or balcony with a bucket can save 100+ litres.", "info"),
            new Tip("Install aerators", "Low-flow aerators on taps cut flow by up to 50% with no loss in comfort.", "info"));

    /** Situational tips first, then three general tips that rotate daily so the feed doesn't go stale. */
    private List<Tip> generalTips(List<Tip> contextual) {
        List<Tip> out = new ArrayList<>(contextual);
        int start = LocalDate.now().getDayOfYear() % GENERAL.size();
        for (int i = 0; i < 3; i++) out.add(GENERAL.get((start + i) % GENERAL.size()));
        return out;
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
