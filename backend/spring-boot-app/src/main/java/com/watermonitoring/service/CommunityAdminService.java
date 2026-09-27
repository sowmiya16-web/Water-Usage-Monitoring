package com.watermonitoring.service;

import com.watermonitoring.entity.*;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * CommunityAdminService — everything the Community Admin dashboards show or
 * change, computed from the real MySQL tables. All writes are validated here
 * (not in the UI) and reject bad input with a BadRequestException (HTTP 400).
 */
@Service
public class CommunityAdminService {

    private static final double LEAK_THRESHOLD_KL = 5.0;
    private static final double MAX_READING = 10_000_000;

    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;
    private final BillRepository billRepository;
    private final BillingCycleRepository cycleRepository;
    private final TariffPlanRepository tariffRepository;
    private final BulkWaterPurchaseRepository purchaseRepository;
    private final AlertRepository alertRepository;

    @Autowired
    public CommunityAdminService(ApartmentRepository apartmentRepository, WaterMeterRepository meterRepository,
                                 WaterUsageRepository usageRepository, BillRepository billRepository,
                                 BillingCycleRepository cycleRepository, TariffPlanRepository tariffRepository,
                                 BulkWaterPurchaseRepository purchaseRepository, AlertRepository alertRepository) {
        this.apartmentRepository = apartmentRepository;
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
        this.billRepository = billRepository;
        this.cycleRepository = cycleRepository;
        this.tariffRepository = tariffRepository;
        this.purchaseRepository = purchaseRepository;
        this.alertRepository = alertRepository;
    }

    /* =====================  DTOs  ===================== */

    public record HouseholdUsage(Long apartmentId, String apartment, String building, String meterSerial,
                                 String meterStatus, Double consumptionKl, Double previousKl,
                                 Double changePct, Double sharePct, Integer readingDays) {}
    public record HouseholdComparison(String period, String previousPeriod, LocalDate from, LocalDate to,
                                      Double totalKl, Double averageKl, List<HouseholdUsage> households) {}
    public record MonthPoint(String month, String label, Double consumptionKl, Double purchasedKl, Double billedAmount) {}
    public record AlertRow(Long alertId, String type, String title, String message, String severity,
                           String status, String apartment, String createdAt) {}
    public record Kpis(int households, int occupied, int meters, int metersOnline, int metersAttention,
                       double monthToDateKl, double avgDailyKl, double collected, double outstanding,
                       int paidBills, int pendingBills, double collectionRatePct, double purchasedKlThisMonth) {}
    public record Dashboard(Kpis kpis, HouseholdComparison households, List<MonthPoint> monthly,
                            CycleRow activeCycle, TariffPlan tariff, List<AlertRow> alerts) {}

    public record MeterRow(Long meterId, String serialNumber, Long apartmentId, String apartment, String building,
                           String status, Integer battery, Integer signal, LocalDate lastReadingDate,
                           Double lastReading, Double lastConsumptionKl) {}
    public record ReadingRow(Long usageId, Long meterId, String serialNumber, String apartment, LocalDate readingDate,
                             Double previousReading, Double currentReading, Double consumptionKl, String recordedAt) {}
    public record CsvError(int line, String message) {}
    public record CsvResult(int rows, int imported, List<CsvError> errors) {}

    public record CycleRow(Long cycleId, String name, LocalDate startDate, LocalDate endDate, String status,
                           int billCount, double billedAmount, double consumptionKl, double purchasedKl) {}
    public record TariffView(TariffPlan current, List<TariffPlan> history) {}
    public record PurchaseSummary(int count, double totalVolumeKl, double totalCost, double avgUnitCost) {}
    public record PurchaseHistory(PurchaseSummary summary, List<BulkWaterPurchase> purchases) {}

    /* =====================  Dashboard  ===================== */

    @Transactional(readOnly = true)
    public Dashboard dashboard() {
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.from(today);
        List<Apartment> apartments = apartmentRepository.findAll();
        List<WaterMeter> meters = meterRepository.findAll();

        HouseholdComparison comparison = householdComparison(ym.toString());
        double mtd = comparison.totalKl();

        List<Bill> liveBills = billRepository.findAll().stream()
                .filter(b -> !"SUPERSEDED".equalsIgnoreCase(b.getStatus())).toList();
        double collected = sum(liveBills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).map(Bill::getTotalAmount));
        double outstanding = sum(liveBills.stream().filter(b -> "PENDING".equalsIgnoreCase(b.getStatus())).map(Bill::getTotalAmount));
        int paid = (int) liveBills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        int pending = (int) liveBills.stream().filter(b -> "PENDING".equalsIgnoreCase(b.getStatus())).count();

        int online = (int) meters.stream().filter(m -> "ONLINE".equalsIgnoreCase(m.getStatus())).count();
        int occupied = (int) apartments.stream().filter(a -> "OCCUPIED".equalsIgnoreCase(a.getOccupancyStatus())).count();

        double purchasedThisMonth = purchaseRepository.findAll().stream()
                .filter(p -> p.getDeliveryDate() != null && YearMonth.from(p.getDeliveryDate()).equals(ym))
                .mapToDouble(p -> nz(p.getVolumeKl())).sum();

        Kpis kpis = new Kpis(apartments.size(), occupied, meters.size(), online, meters.size() - online,
                round2(mtd), round2(today.getDayOfMonth() > 0 ? mtd / today.getDayOfMonth() : 0),
                round2(collected), round2(outstanding), paid, pending,
                collected + outstanding > 0 ? round2(collected * 100.0 / (collected + outstanding)) : 0,
                round2(purchasedThisMonth));

        Map<Long, Apartment> aptById = apartments.stream().collect(Collectors.toMap(Apartment::getApartmentId, Function.identity()));
        List<AlertRow> alerts = alertRepository.findAllByOrderByCreatedAtDesc().stream().limit(6)
                .map(a -> new AlertRow(a.getAlertId(), a.getAlertType(), a.getTitle(), a.getMessage(), a.getSeverity(),
                        a.getStatus(), a.getApartmentId() != null && aptById.containsKey(a.getApartmentId())
                                ? aptById.get(a.getApartmentId()).getApartmentNumber() : null,
                        a.getCreatedAt() != null ? a.getCreatedAt().toString() : null)).toList();

        CycleRow active = cycleRepository.findFirstByStatusOrderByStartDateAsc("OPEN").map(this::toCycleRow).orElse(null);
        return new Dashboard(kpis, comparison, monthlySeries(6), active,
                tariffRepository.findByBuildingId(1).orElse(null), alerts);
    }

    private List<MonthPoint> monthlySeries(int months) {
        YearMonth now = YearMonth.now();
        LocalDate from = now.minusMonths(months - 1).atDay(1);
        Map<YearMonth, Double> usage = new HashMap<>();
        for (WaterUsage u : usageRepository.findByReadingDateBetween(from, now.atEndOfMonth()))
            usage.merge(YearMonth.from(u.getReadingDate()), nz(u.getConsumptionKl()), Double::sum);
        Map<YearMonth, Double> bought = new HashMap<>();
        for (BulkWaterPurchase p : purchaseRepository.findAll())
            if (p.getDeliveryDate() != null) bought.merge(YearMonth.from(p.getDeliveryDate()), nz(p.getVolumeKl()), Double::sum);
        Map<YearMonth, Double> billed = new HashMap<>();
        for (Bill b : billRepository.findAll())
            if (b.getCreatedAt() != null && !"SUPERSEDED".equalsIgnoreCase(b.getStatus()))
                billed.merge(YearMonth.from(b.getCreatedAt()), nz(b.getTotalAmount()), Double::sum);

        List<MonthPoint> out = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth m = now.minusMonths(i);
            out.add(new MonthPoint(m.toString(), m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + m.getYear() % 100,
                    round2(usage.getOrDefault(m, 0.0)), round2(bought.getOrDefault(m, 0.0)), round2(billed.getOrDefault(m, 0.0))));
        }
        return out;
    }

    /* =====================  Household comparison  ===================== */

    @Transactional(readOnly = true)
    public HouseholdComparison householdComparison(String month) {
        YearMonth ym = parseMonth(month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        YearMonth prev = ym.minusMonths(1);
        // Mid-month, compare against the same number of days last month (not its full total).
        LocalDate prevEnd = ym.equals(YearMonth.now())
                ? prev.atDay(Math.min(LocalDate.now().getDayOfMonth(), prev.lengthOfMonth())) : prev.atEndOfMonth();

        Map<Long, Double> cur = new HashMap<>(), before = new HashMap<>();
        Map<Long, Integer> days = new HashMap<>();
        for (WaterUsage u : usageRepository.findByReadingDateBetween(prev.atDay(1), to)) {
            if (YearMonth.from(u.getReadingDate()).equals(ym)) {
                cur.merge(u.getMeterId(), nz(u.getConsumptionKl()), Double::sum);
                days.merge(u.getMeterId(), 1, Integer::sum);
            } else if (!u.getReadingDate().isAfter(prevEnd)) {
                before.merge(u.getMeterId(), nz(u.getConsumptionKl()), Double::sum);
            }
        }
        Map<Long, WaterMeter> meterByApt = new HashMap<>();
        for (WaterMeter m : meterRepository.findAll()) if (m.getApartmentId() != null) meterByApt.put(m.getApartmentId(), m);

        double total = cur.values().stream().mapToDouble(Double::doubleValue).sum();
        List<HouseholdUsage> rows = new ArrayList<>();
        for (Apartment a : apartmentRepository.findAll()) {
            WaterMeter m = meterByApt.get(a.getApartmentId());
            double c = m != null ? cur.getOrDefault(m.getMeterId(), 0.0) : 0;
            double p = m != null ? before.getOrDefault(m.getMeterId(), 0.0) : 0;
            rows.add(new HouseholdUsage(a.getApartmentId(), a.getApartmentNumber(), a.getBuildingName(),
                    m != null ? m.getSerialNumber() : null, m != null ? m.getStatus() : null, round2(c), round2(p),
                    p > 0 ? round2((c - p) * 100.0 / p) : null, total > 0 ? round2(c * 100.0 / total) : 0.0,
                    m != null ? days.getOrDefault(m.getMeterId(), 0) : 0));
        }
        rows.sort(Comparator.comparing(HouseholdUsage::consumptionKl).reversed());
        return new HouseholdComparison(ym.toString(), prev.toString(), from, to, round2(total),
                rows.isEmpty() ? 0 : round2(total / rows.size()), rows);
    }

    /* =====================  Meters & readings  ===================== */

    @Transactional(readOnly = true)
    public List<MeterRow> meters() {
        Map<Long, Apartment> apts = apartmentRepository.findAll().stream()
                .collect(Collectors.toMap(Apartment::getApartmentId, Function.identity()));
        List<MeterRow> rows = new ArrayList<>();
        for (WaterMeter m : meterRepository.findAll()) {
            Apartment a = m.getApartmentId() != null ? apts.get(m.getApartmentId()) : null;
            Optional<WaterUsage> last = usageRepository.findTopByMeterIdOrderByReadingDateDescUsageIdDesc(m.getMeterId());
            rows.add(new MeterRow(m.getMeterId(), m.getSerialNumber(), m.getApartmentId(),
                    a != null ? a.getApartmentNumber() : null, a != null ? a.getBuildingName() : null, m.getStatus(),
                    m.getBatteryPercentage(), m.getSignalStrength(),
                    last.map(WaterUsage::getReadingDate).orElse(null), last.map(WaterUsage::getCurrentReading).orElse(null),
                    last.map(WaterUsage::getConsumptionKl).orElse(null)));
        }
        rows.sort(Comparator.comparing(MeterRow::meterId));
        return rows;
    }

    @Transactional(readOnly = true)
    public List<ReadingRow> recentReadings(Long meterId, int limit) {
        int cap = Math.min(Math.max(limit, 1), 200);
        Map<Long, WaterMeter> meters = meterRepository.findAll().stream().collect(Collectors.toMap(WaterMeter::getMeterId, Function.identity()));
        Map<Long, Apartment> apts = apartmentRepository.findAll().stream().collect(Collectors.toMap(Apartment::getApartmentId, Function.identity()));
        List<WaterUsage> src = meterId != null ? usageRepository.findByMeterId(meterId) : usageRepository.findAll();
        return src.stream()
                .sorted(Comparator.comparing(WaterUsage::getReadingDate).reversed().thenComparing(WaterUsage::getUsageId, Comparator.reverseOrder()))
                .limit(cap).map(u -> {
                    WaterMeter m = meters.get(u.getMeterId());
                    Apartment a = m != null && m.getApartmentId() != null ? apts.get(m.getApartmentId()) : null;
                    return new ReadingRow(u.getUsageId(), u.getMeterId(), m != null ? m.getSerialNumber() : null,
                            a != null ? a.getApartmentNumber() : null, u.getReadingDate(), u.getPreviousReading(),
                            u.getCurrentReading(), u.getConsumptionKl(),
                            u.getRecordedAt() != null ? u.getRecordedAt().toString() : null);
                }).toList();
    }

    @Transactional
    public ReadingRow addReading(Long meterId, LocalDate date, Double current, Double previous) {
        WaterMeter meter = meterRepository.findById(meterId)
                .orElseThrow(() -> new ResourceNotFoundException("Meter " + meterId + " not found"));
        WaterUsage saved = saveReading(meter, date, current, previous);
        return recentReadings(meterId, 1).stream().filter(r -> r.usageId().equals(saved.getUsageId())).findFirst().orElse(null);
    }

    /** Shared by the single-entry form and the CSV import so both obey identical rules. */
    private WaterUsage saveReading(WaterMeter meter, LocalDate date, Double current, Double previous) {
        if (date == null) throw new BadRequestException("Reading date is required.");
        if (date.isAfter(LocalDate.now())) throw new BadRequestException("Reading date cannot be in the future.");
        if (current == null || current.isNaN() || current < 0 || current > MAX_READING)
            throw new BadRequestException("Current reading must be a number between 0 and " + (long) MAX_READING + ".");
        if (usageRepository.existsByMeterIdAndReadingDate(meter.getMeterId(), date))
            throw new BadRequestException("A reading for " + meter.getSerialNumber() + " on " + date + " already exists.");

        double prev;
        if (previous != null) {
            if (previous < 0) throw new BadRequestException("Previous reading cannot be negative.");
            prev = previous;
        } else {
            prev = usageRepository.findTopByMeterIdOrderByReadingDateDescUsageIdDesc(meter.getMeterId())
                    .map(WaterUsage::getCurrentReading).orElse(current);
        }
        if (current < prev) throw new BadRequestException("Current reading (" + current + ") cannot be lower than the previous reading (" + prev + ").");

        double consumption = round2(current - prev);
        WaterUsage saved = usageRepository.save(new WaterUsage(meter.getMeterId(), prev, current, consumption, date));
        if (consumption > LEAK_THRESHOLD_KL) {
            meter.setStatus("ALERT");
            meterRepository.save(meter);
        }
        return saved;
    }

    /** CSV columns: meter (serial number or id), current, date[, previous]. Row errors are reported, not fatal. */
    @Transactional
    public CsvResult importReadingsCsv(java.io.InputStream in) throws java.io.IOException {
        Map<String, WaterMeter> bySerial = new HashMap<>();
        Map<String, WaterMeter> byId = new HashMap<>();
        for (WaterMeter m : meterRepository.findAll()) {
            bySerial.put(m.getSerialNumber().toLowerCase(), m);
            byId.put(String.valueOf(m.getMeterId()), m);
        }
        List<CsvError> errors = new ArrayList<>();
        int rows = 0, imported = 0, lineNo = 0;
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                lineNo++;
                line = line.replace("﻿", "").trim();
                if (line.isEmpty()) continue;
                String[] c = line.split(",", -1);
                if (lineNo == 1 && (c[0].trim().toLowerCase().startsWith("meter") || c[0].trim().toLowerCase().startsWith("serial"))) continue;
                rows++;
                try {
                    if (c.length < 3) throw new BadRequestException("Expected: meter, current reading, date[, previous reading].");
                    String key = c[0].trim();
                    WaterMeter meter = bySerial.getOrDefault(key.toLowerCase(), byId.get(key));
                    if (meter == null) throw new BadRequestException("Unknown meter '" + key + "'.");
                    Double current = parseNumber(c[1], "current reading");
                    LocalDate date;
                    try { date = LocalDate.parse(c[2].trim()); }
                    catch (Exception e) { throw new BadRequestException("Date must be YYYY-MM-DD."); }
                    Double previous = c.length > 3 && !c[3].isBlank() ? parseNumber(c[3], "previous reading") : null;
                    saveReading(meter, date, current, previous);
                    imported++;
                } catch (BadRequestException e) {
                    errors.add(new CsvError(lineNo, e.getMessage()));
                }
            }
        }
        if (rows == 0) throw new BadRequestException("The CSV file has no data rows.");
        return new CsvResult(rows, imported, errors);
    }

    private Double parseNumber(String s, String what) {
        try { return Double.parseDouble(s.trim()); }
        catch (Exception e) { throw new BadRequestException("Invalid " + what + " '" + s.trim() + "'."); }
    }

    /* =====================  Billing cycles  ===================== */

    @Transactional(readOnly = true)
    public List<CycleRow> cycles() {
        return cycleRepository.findAllByOrderByStartDateDesc().stream().map(this::toCycleRow).toList();
    }

    private CycleRow toCycleRow(BillingCycle c) {
        double consumption = usageRepository.findByReadingDateBetween(c.getStartDate(), c.getEndDate()).stream()
                .mapToDouble(u -> nz(u.getConsumptionKl())).sum();
        List<Bill> bills = billRepository.findAll().stream()
                .filter(b -> b.getCreatedAt() != null && !"SUPERSEDED".equalsIgnoreCase(b.getStatus())
                        && !b.getCreatedAt().toLocalDate().isBefore(c.getStartDate())
                        && !b.getCreatedAt().toLocalDate().isAfter(c.getEndDate())).toList();
        double purchased = purchaseRepository.findByBillingCycleId(c.getCycleId()).stream().mapToDouble(p -> nz(p.getVolumeKl())).sum();
        return new CycleRow(c.getCycleId(), c.getCycleName(), c.getStartDate(), c.getEndDate(), c.getStatus(),
                bills.size(), round2(sum(bills.stream().map(Bill::getTotalAmount))), round2(consumption), round2(purchased));
    }

    @Transactional
    public CycleRow createCycle(String name, LocalDate start, LocalDate end) {
        if (name == null || name.isBlank()) throw new BadRequestException("Cycle name is required.");
        if (name.trim().length() > 50) throw new BadRequestException("Cycle name must be 50 characters or fewer.");
        if (start == null || end == null) throw new BadRequestException("Start and end dates are required.");
        if (!end.isAfter(start)) throw new BadRequestException("End date must be after the start date.");
        if (start.plusDays(370).isBefore(end)) throw new BadRequestException("A billing cycle cannot be longer than one year.");
        List<BillingCycle> all = cycleRepository.findAll();
        for (BillingCycle c : all) {
            if (c.getCycleName().equalsIgnoreCase(name.trim())) throw new BadRequestException("A cycle named '" + c.getCycleName() + "' already exists.");
            if (!start.isAfter(c.getEndDate()) && !end.isBefore(c.getStartDate()))
                throw new BadRequestException("Dates overlap the existing cycle '" + c.getCycleName() + "' (" + c.getStartDate() + " to " + c.getEndDate() + ").");
        }
        boolean hasOpen = all.stream().anyMatch(c -> "OPEN".equalsIgnoreCase(c.getStatus()));
        BillingCycle saved = cycleRepository.save(new BillingCycle(name.trim(), start, end, hasOpen ? "UPCOMING" : "OPEN"));
        return toCycleRow(saved);
    }

    /** Closes the OPEN cycle; the earliest UPCOMING cycle (if any) becomes the new OPEN one. */
    @Transactional
    public CycleRow closeCycle(Long id) {
        BillingCycle c = cycleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Billing cycle " + id + " not found"));
        if (!"OPEN".equalsIgnoreCase(c.getStatus())) throw new BadRequestException("Only the open cycle can be closed (this one is " + c.getStatus() + ").");
        c.setStatus("CLOSED");
        cycleRepository.save(c);
        cycleRepository.findFirstByStatusOrderByStartDateAsc("UPCOMING").ifPresent(n -> { n.setStatus("OPEN"); cycleRepository.save(n); });
        return toCycleRow(c);
    }

    /* =====================  Tariffs (append-only versions)  ===================== */

    @Transactional(readOnly = true)
    public TariffView tariffs(Integer buildingId) {
        int b = buildingId != null ? buildingId : 1;
        List<TariffPlan> history = tariffRepository.findByBuildingIdOrderByPlanIdDesc(b);
        return new TariffView(history.isEmpty() ? null : history.get(0), history);
    }

    /** Always INSERTs a new version row — previous tariffs are never modified. */
    @Transactional
    public TariffPlan createTariffVersion(TariffPlan in) {
        if (in.getPlanName() == null || in.getPlanName().isBlank()) throw new BadRequestException("Plan name is required.");
        if (in.getPlanName().trim().length() > 100) throw new BadRequestException("Plan name must be 100 characters or fewer.");
        requireRange(in.getTier1LimitKl(), 0.1, 1000, "Tier 1 limit (KL)");
        requireRange(in.getTier2LimitKl(), 0.1, 1000, "Tier 2 limit (KL)");
        requireRange(in.getTier1RatePerKl(), 0, 1000, "Tier 1 rate");
        requireRange(in.getTier2RatePerKl(), 0, 1000, "Tier 2 rate");
        requireRange(in.getTier3RatePerKl(), 0, 1000, "Tier 3 rate");
        requireRange(in.getFixedBaseCharge(), 0, 100000, "Fixed base charge");
        requireRange(in.getCommonWaterCharge(), 0, 100000, "Common water charge");
        if (in.getTier2LimitKl() <= in.getTier1LimitKl()) throw new BadRequestException("Tier 2 limit must be greater than the Tier 1 limit.");

        int bid = in.getBuildingId() != null ? in.getBuildingId() : 1;
        Optional<TariffPlan> cur = tariffRepository.findByBuildingId(bid);
        if (cur.isPresent()) {
            TariffPlan c = cur.get();
            boolean same = Objects.equals(c.getTier1LimitKl(), in.getTier1LimitKl()) && Objects.equals(c.getTier2LimitKl(), in.getTier2LimitKl())
                    && Objects.equals(c.getTier1RatePerKl(), in.getTier1RatePerKl()) && Objects.equals(c.getTier2RatePerKl(), in.getTier2RatePerKl())
                    && Objects.equals(c.getTier3RatePerKl(), in.getTier3RatePerKl()) && Objects.equals(c.getFixedBaseCharge(), in.getFixedBaseCharge())
                    && Objects.equals(c.getCommonWaterCharge(), in.getCommonWaterCharge());
            if (same) throw new BadRequestException("These rates are identical to the current tariff (version " + c.getVersion() + ") — nothing to save.");
        }
        int next = tariffRepository.findByBuildingIdOrderByPlanIdDesc(bid).stream()
                .mapToInt(TariffPlan::getVersion).max().orElse(0) + 1;

        TariffPlan n = new TariffPlan(in.getPlanName().trim(), bid, in.getTier1LimitKl(), in.getTier1RatePerKl(),
                in.getTier2LimitKl(), in.getTier2RatePerKl(), in.getTier3RatePerKl(), in.getFixedBaseCharge(), in.getCommonWaterCharge());
        n.setPlanId(null);
        n.setVersion(next);
        n.setEffectiveFrom(LocalDateTime.now());
        return tariffRepository.save(n);
    }

    private void requireRange(Double v, double min, double max, String what) {
        if (v == null || v.isNaN() || v < min || v > max)
            throw new BadRequestException(what + " is required and must be between " + trim(min) + " and " + trim(max) + ".");
    }

    private String trim(double d) { return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d); }

    /* =====================  Bulk water purchases  ===================== */

    @Transactional(readOnly = true)
    public PurchaseHistory purchases() {
        List<BulkWaterPurchase> list = purchaseRepository.findAllByOrderByDeliveryDateDescPurchaseIdDesc();
        double vol = list.stream().mapToDouble(p -> nz(p.getVolumeKl())).sum();
        double cost = list.stream().mapToDouble(p -> nz(p.getTotalCost())).sum();
        return new PurchaseHistory(new PurchaseSummary(list.size(), round2(vol), round2(cost), vol > 0 ? round2(cost / vol) : 0), list);
    }

    @Transactional
    public BulkWaterPurchase recordPurchase(BulkWaterPurchase in) {
        if (in.getSupplierName() == null || in.getSupplierName().isBlank()) throw new BadRequestException("Supplier name is required.");
        if (in.getSupplierName().trim().length() > 100) throw new BadRequestException("Supplier name must be 100 characters or fewer.");
        if (in.getDeliveryDate() == null) throw new BadRequestException("Delivery date is required.");
        if (in.getDeliveryDate().isAfter(LocalDate.now())) throw new BadRequestException("Delivery date cannot be in the future.");
        if (in.getDeliveryDate().isBefore(LocalDate.now().minusYears(5))) throw new BadRequestException("Delivery date is more than 5 years ago — please check it.");
        if (in.getVolumeKl() == null || in.getVolumeKl().isNaN() || in.getVolumeKl() <= 0 || in.getVolumeKl() > 1_000_000)
            throw new BadRequestException("Volume must be greater than 0 and at most 1,000,000 KL.");
        if (in.getTotalCost() == null || in.getTotalCost().isNaN() || in.getTotalCost() <= 0 || in.getTotalCost() > 1_000_000_000)
            throw new BadRequestException("Total cost must be greater than 0.");
        if (in.getWaterSource() != null && in.getWaterSource().length() > 100) throw new BadRequestException("Water source must be 100 characters or fewer.");
        if (in.getNotes() != null && in.getNotes().length() > 2000) throw new BadRequestException("Notes must be 2000 characters or fewer.");

        LocalDate d = in.getDeliveryDate();
        Long cycleId = cycleRepository.findAll().stream()
                .filter(c -> !d.isBefore(c.getStartDate()) && !d.isAfter(c.getEndDate())).map(BillingCycle::getCycleId).findFirst()
                .orElseGet(() -> cycleRepository.findByStatus("OPEN").map(BillingCycle::getCycleId).orElse(null));

        BulkWaterPurchase p = new BulkWaterPurchase(in.getSupplierName().trim(), d, in.getVolumeKl(), in.getTotalCost(),
                blankToNull(in.getWaterSource()), round2(in.getTotalCost() / in.getVolumeKl()), blankToNull(in.getNotes()), cycleId);
        p.setBillingCycleId(cycleId);
        return purchaseRepository.save(p);
    }

    /* =====================  helpers  ===================== */

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) return YearMonth.now();
        try { return YearMonth.parse(month.trim()); }
        catch (Exception e) { throw new BadRequestException("Month must be in YYYY-MM format."); }
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
    private static double nz(Double d) { return d == null ? 0 : d; }
    private static double sum(java.util.stream.Stream<Double> s) { return s.mapToDouble(CommunityAdminService::nz).sum(); }
    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
