package com.watermonitoring.service;

import com.watermonitoring.dto.resident.ResidentDto;
import com.watermonitoring.entity.*;
import com.watermonitoring.exception.BadRequestException;
import com.watermonitoring.exception.ResourceNotFoundException;
import com.watermonitoring.repository.*;
import com.watermonitoring.service.CommunityAdminService.ReadingRow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * HouseholdService — one household = one Apartment + its residents + its meter + its
 * daily readings. Everything is computed from the real tables; monthly figures come from
 * SQL aggregates (never by loading every daily reading), so it scales with the number of
 * households. All writes are validated here and rejected with HTTP 400 on bad input.
 */
@Service
public class HouseholdService {

    private static final Set<String> OCCUPANCY = Set.of("OCCUPIED", "VACANT");
    private static final Set<String> METER_STATUS = Set.of("ONLINE", "OFFLINE", "ALERT");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE = Pattern.compile("^[0-9+()\\-\\s]{7,20}$");
    private static final DateTimeFormatter BILL_MONTH = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final double HIGH_USER_FACTOR = 1.5;

    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;
    private final ResidentRepository residentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BillRepository billRepository;
    private final AlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public HouseholdService(ApartmentRepository apartmentRepository, WaterMeterRepository meterRepository,
                            WaterUsageRepository usageRepository, ResidentRepository residentRepository,
                            UserRepository userRepository, RoleRepository roleRepository, BillRepository billRepository,
                            AlertRepository alertRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.apartmentRepository = apartmentRepository;
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
        this.residentRepository = residentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.billRepository = billRepository;
        this.alertRepository = alertRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /* =====================  DTOs  ===================== */

    public record ResidentRow(Long residentId, String fullName, String email, String phone, boolean primary,
                              boolean hasLogin, String registeredAt) {}
    public record MeterInfo(Long meterId, String serialNumber, String status, Integer battery, Integer signal,
                            LocalDate lastReadingDate) {}
    public record HouseholdRow(Long apartmentId, String apartmentNumber, String buildingName, Integer floorNumber,
                               String occupancyStatus, List<ResidentRow> residents, MeterInfo meter,
                               double currentKl, double previousKl, Double changePct, double sharePct, int readingDays,
                               int pendingBills, double pendingAmount) {}
    public record HouseholdList(String month, String previousMonth, int total, int occupied, int vacant, int withMeter,
                                int highUsers, double totalKl, double averageKl, List<String> buildings,
                                int page, int size, int matched, List<HouseholdRow> households) {}

    public record MonthUsage(String month, String label, double consumptionKl, int readingDays, double avgDailyKl,
                             double peakDayKl, double communityAvgKl, Double vsCommunityPct, double billedAmount,
                             String billStatus) {}
    public record BillRow(Long billId, String billNumber, String billingMonth, Double consumptionKl, Double totalAmount,
                          String status, LocalDate dueDate) {}
    public record Comparison(String month, int rank, int outOf, double householdKl, double communityAvgKl,
                             Double vsCommunityPct, String verdict) {}
    public record HouseholdDetail(HouseholdRow household, List<MonthUsage> history, List<ReadingRow> recentReadings,
                                  List<BillRow> bills, Comparison comparison, double totalBilled, double totalPaid) {}

    public record ResidentRequest(String fullName, String email, String phone, Boolean sendWelcomeEmail) {}
    public record HouseholdRequest(String apartmentNumber, String buildingName, Integer floorNumber,
                                   String occupancyStatus, String meterSerial, String meterStatus,
                                   Double initialReading, Boolean createMeter, ResidentRequest resident) {}
    public record ResidentAdded(ResidentRow resident, boolean loginCreated, boolean linkedExisting, Boolean emailSent) {}
    public record DeleteResult(String household, int readingsRemoved, int residentsRemoved) {}

    /* =====================  Listing  ===================== */

    @Transactional(readOnly = true)
    public HouseholdList list(String month, String q, String building, String status, String sort, int page, int size) {
        YearMonth ym = parseMonth(month);
        List<HouseholdRow> all = buildRows(ym);
        double total = all.stream().mapToDouble(HouseholdRow::currentKl).sum();
        double avg = all.isEmpty() ? 0 : total / all.size();
        int highCount = (int) all.stream().filter(h -> isHigh(h, avg)).count();

        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        List<HouseholdRow> filtered = all.stream().filter(h -> matches(h, needle, building, status, avg)).collect(Collectors.toList());
        filtered.sort(comparator(sort));

        int sz = Math.min(Math.max(size, 1), 100);
        int pg = Math.max(page, 0);
        int from = Math.min(pg * sz, filtered.size());
        List<HouseholdRow> pageRows = filtered.subList(from, Math.min(from + sz, filtered.size()));

        List<String> buildings = all.stream().map(HouseholdRow::buildingName).filter(Objects::nonNull).distinct().sorted().toList();
        return new HouseholdList(ym.toString(), ym.minusMonths(1).toString(), all.size(),
                (int) all.stream().filter(h -> "OCCUPIED".equalsIgnoreCase(h.occupancyStatus())).count(),
                (int) all.stream().filter(h -> "VACANT".equalsIgnoreCase(h.occupancyStatus())).count(),
                (int) all.stream().filter(h -> h.meter() != null).count(), highCount, round2(total), round2(avg),
                buildings, pg, sz, filtered.size(), new ArrayList<>(pageRows));
    }

    /** Every household for the given month (unfiltered, unpaged) — used by the chatbot context. */
    @Transactional(readOnly = true)
    public List<HouseholdRow> snapshot(String month) {
        return buildRows(parseMonth(month));
    }

    /** meterId -> yyyy-MM -> kl for the trailing window, in one aggregate query (chatbot history). */
    @Transactional(readOnly = true)
    public Map<Long, Map<YearMonth, Double>> monthlyByMeter(int months) {
        YearMonth now = YearMonth.now();
        Map<Long, Map<YearMonth, Double>> out = new HashMap<>();
        for (Object[] r : usageRepository.monthlyTotals(now.minusMonths(months - 1).atDay(1), now.atEndOfMonth())) {
            out.computeIfAbsent(((Number) r[0]).longValue(), k -> new HashMap<>())
                    .put(YearMonth.of(((Number) r[1]).intValue(), ((Number) r[2]).intValue()), round2(num(r[3])));
        }
        return out;
    }

    private boolean isHigh(HouseholdRow h, double avg) {
        return avg > 0 && h.currentKl() > avg * HIGH_USER_FACTOR;
    }

    private boolean matches(HouseholdRow h, String needle, String building, String status, double avg) {
        if (building != null && !building.isBlank() && !building.equalsIgnoreCase(h.buildingName())) return false;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            switch (status.toUpperCase(Locale.ROOT)) {
                case "OCCUPIED", "VACANT" -> { if (!status.equalsIgnoreCase(h.occupancyStatus())) return false; }
                case "NO_METER" -> { if (h.meter() != null) return false; }
                case "NO_READINGS" -> { if (h.meter() == null || h.readingDays() > 0) return false; }
                case "HIGH" -> { if (!isHigh(h, avg)) return false; }
                case "PENDING_BILLS" -> { if (h.pendingBills() == 0) return false; }
                default -> { }
            }
        }
        if (needle.isEmpty()) return true;
        StringBuilder hay = new StringBuilder();
        hay.append(h.apartmentNumber()).append(' ').append(h.buildingName());
        if (h.meter() != null) hay.append(' ').append(h.meter().serialNumber());
        for (ResidentRow r : h.residents()) hay.append(' ').append(r.fullName()).append(' ').append(r.email());
        return hay.toString().toLowerCase(Locale.ROOT).contains(needle);
    }

    private Comparator<HouseholdRow> comparator(String sort) {
        Comparator<HouseholdRow> byName = Comparator.comparing(HouseholdRow::buildingName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(h -> h.apartmentNumber().toLowerCase(Locale.ROOT), naturalOrder());
        if (sort == null) sort = "usage";
        return switch (sort.toLowerCase(Locale.ROOT)) {
            case "name" -> byName;
            case "change" -> Comparator.comparing((HouseholdRow h) -> h.changePct() == null ? Double.NEGATIVE_INFINITY : h.changePct()).reversed().thenComparing(byName);
            default -> Comparator.comparingDouble(HouseholdRow::currentKl).reversed().thenComparing(byName);
        };
    }

    private static Comparator<String> naturalOrder() {
        return (a, b) -> {
            int i = 0, j = 0;
            while (i < a.length() && j < b.length()) {
                char x = a.charAt(i), y = b.charAt(j);
                if (Character.isDigit(x) && Character.isDigit(y)) {
                    int si = i, sj = j;
                    while (i < a.length() && Character.isDigit(a.charAt(i))) i++;
                    while (j < b.length() && Character.isDigit(b.charAt(j))) j++;
                    int c = new java.math.BigInteger(a.substring(si, i)).compareTo(new java.math.BigInteger(b.substring(sj, j)));
                    if (c != 0) return c;
                } else {
                    if (x != y) return Character.compare(x, y);
                    i++; j++;
                }
            }
            return Integer.compare(a.length() - i, b.length() - j);
        };
    }

    private List<HouseholdRow> buildRows(YearMonth ym) {
        YearMonth prev = ym.minusMonths(1);
        LocalDate prevEnd = ym.equals(YearMonth.now())
                ? prev.atDay(Math.min(LocalDate.now().getDayOfMonth(), prev.lengthOfMonth())) : prev.atEndOfMonth();

        Map<Long, double[]> cur = periodMap(ym.atDay(1), ym.atEndOfMonth());
        Map<Long, double[]> before = periodMap(prev.atDay(1), prevEnd);
        Map<Long, LocalDate> lastDates = new HashMap<>();
        for (Object[] r : usageRepository.lastReadingDates()) lastDates.put(((Number) r[0]).longValue(), (LocalDate) r[1]);

        Map<Long, WaterMeter> meterByApt = new HashMap<>();
        for (WaterMeter m : meterRepository.findAll()) if (m.getApartmentId() != null) meterByApt.putIfAbsent(m.getApartmentId(), m);

        Map<Long, List<Resident>> residentsByApt = new HashMap<>();
        for (Resident r : residentRepository.findAll())
            if (r.getApartmentId() != null) residentsByApt.computeIfAbsent(r.getApartmentId(), k -> new ArrayList<>()).add(r);

        Map<Long, int[]> pendingCount = new HashMap<>();
        Map<Long, Double> pendingSum = new HashMap<>();
        for (Bill b : billRepository.findByStatus("PENDING")) {
            if (b.getApartmentId() == null) continue;
            pendingCount.computeIfAbsent(b.getApartmentId(), k -> new int[1])[0]++;
            pendingSum.merge(b.getApartmentId(), nz(b.getTotalAmount()), Double::sum);
        }

        double total = cur.values().stream().mapToDouble(v -> v[0]).sum();
        List<HouseholdRow> rows = new ArrayList<>();
        for (Apartment a : apartmentRepository.findAll()) {
            WaterMeter m = meterByApt.get(a.getApartmentId());
            double c = m != null ? cur.getOrDefault(m.getMeterId(), new double[2])[0] : 0;
            int days = m != null ? (int) cur.getOrDefault(m.getMeterId(), new double[2])[1] : 0;
            double p = m != null ? before.getOrDefault(m.getMeterId(), new double[2])[0] : 0;
            List<ResidentRow> res = residentsByApt.getOrDefault(a.getApartmentId(), List.of()).stream()
                    .sorted(Comparator.comparing(Resident::getResidentId)).map(r -> toRow(r, a)).toList();
            MeterInfo mi = m == null ? null : new MeterInfo(m.getMeterId(), m.getSerialNumber(), m.getStatus(),
                    m.getBatteryPercentage(), m.getSignalStrength(), lastDates.get(m.getMeterId()));
            rows.add(new HouseholdRow(a.getApartmentId(), a.getApartmentNumber(), a.getBuildingName(), a.getFloorNumber(),
                    a.getOccupancyStatus(), res, mi, round2(c), round2(p), p > 0 ? round2((c - p) * 100.0 / p) : null,
                    total > 0 ? round2(c * 100.0 / total) : 0.0, days,
                    pendingCount.getOrDefault(a.getApartmentId(), new int[1])[0],
                    round2(pendingSum.getOrDefault(a.getApartmentId(), 0.0))));
        }
        return rows;
    }

    private Map<Long, double[]> periodMap(LocalDate from, LocalDate to) {
        Map<Long, double[]> out = new HashMap<>();
        for (Object[] r : usageRepository.periodTotals(from, to))
            out.put(((Number) r[0]).longValue(), new double[]{num(r[1]), ((Number) r[2]).doubleValue()});
        return out;
    }

    private ResidentRow toRow(Resident r, Apartment a) {
        boolean login = r.getUserId() != null;
        return new ResidentRow(r.getResidentId(), r.getFullName(), r.getEmail(), r.getPhone(),
                login && Objects.equals(r.getUserId(), a.getResidentUserId()), login,
                r.getRegisteredDate() != null ? r.getRegisteredDate().toString() : null);
    }

    /* =====================  Detail & history  ===================== */

    @Transactional(readOnly = true)
    public HouseholdDetail detail(Long id, int months) {
        Apartment apt = requireApartment(id);
        int span = Math.min(Math.max(months, 1), 36);
        YearMonth now = YearMonth.now();
        List<HouseholdRow> all = buildRows(now);
        HouseholdRow row = all.stream().filter(h -> h.apartmentId().equals(id)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Household " + id + " not found"));

        LocalDate from = now.minusMonths(span - 1).atDay(1);
        Map<YearMonth, double[]> mine = new HashMap<>();
        if (row.meter() != null)
            for (Object[] r : usageRepository.monthlyTotalsForMeter(row.meter().meterId(), from, now.atEndOfMonth()))
                mine.put(YearMonth.of(((Number) r[1]).intValue(), ((Number) r[2]).intValue()),
                        new double[]{num(r[3]), ((Number) r[4]).doubleValue(), num(r[5])});

        Map<YearMonth, double[]> community = new HashMap<>(); // sum, meters-with-data
        for (Object[] r : usageRepository.monthlyTotals(from, now.atEndOfMonth())) {
            double sum = num(r[3]);
            if (sum <= 0) continue;
            double[] acc = community.computeIfAbsent(YearMonth.of(((Number) r[1]).intValue(), ((Number) r[2]).intValue()), k -> new double[2]);
            acc[0] += sum;
            acc[1] += 1;
        }

        List<Bill> bills = billRepository.findByApartmentIdOrderByCreatedAtAsc(id).stream()
                .filter(b -> !"SUPERSEDED".equalsIgnoreCase(b.getStatus())).toList();
        Map<YearMonth, List<Bill>> billsByMonth = new HashMap<>();
        for (Bill b : bills) {
            YearMonth bm = parseBillMonth(b.getBillingMonth());
            if (bm != null) billsByMonth.computeIfAbsent(bm, k -> new ArrayList<>()).add(b);
        }

        List<MonthUsage> history = new ArrayList<>();
        for (int i = span - 1; i >= 0; i--) {
            YearMonth m = now.minusMonths(i);
            double[] u = mine.getOrDefault(m, new double[3]);
            double[] c = community.get(m);
            double cAvg = c != null && c[1] > 0 ? c[0] / c[1] : 0;
            List<Bill> mb = billsByMonth.getOrDefault(m, List.of());
            String bs = mb.isEmpty() ? null : mb.stream().map(Bill::getStatus).distinct().count() > 1 ? "MIXED" : mb.get(0).getStatus();
            history.add(new MonthUsage(m.toString(), m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + m.getYear() % 100,
                    round2(u[0]), (int) u[1], u[1] > 0 ? round2(u[0] / u[1]) : 0, round2(u[2]), round2(cAvg),
                    cAvg > 0 && u[1] > 0 ? round2((u[0] - cAvg) * 100.0 / cAvg) : null,
                    round2(mb.stream().mapToDouble(b -> nz(b.getTotalAmount())).sum()), bs));
        }

        List<ReadingRow> readings = row.meter() == null ? List.of()
                : usageRepository.findTop30ByMeterIdOrderByReadingDateDescUsageIdDesc(row.meter().meterId()).stream()
                .map(u -> new ReadingRow(u.getUsageId(), u.getMeterId(), row.meter().serialNumber(), apt.getApartmentNumber(),
                        u.getReadingDate(), u.getPreviousReading(), u.getCurrentReading(), u.getConsumptionKl(),
                        u.getRecordedAt() != null ? u.getRecordedAt().toString() : null)).toList();

        List<BillRow> billRows = new ArrayList<>();
        for (int i = bills.size() - 1; i >= 0 && billRows.size() < 24; i--) {
            Bill b = bills.get(i);
            billRows.add(new BillRow(b.getBillId(), b.getBillNumber(), b.getBillingMonth(), b.getConsumptionKl(),
                    b.getTotalAmount(), b.getStatus(), b.getDueDate()));
        }
        double billed = bills.stream().mapToDouble(b -> nz(b.getTotalAmount())).sum();
        double paid = bills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).mapToDouble(b -> nz(b.getTotalAmount())).sum();

        return new HouseholdDetail(row, history, readings, billRows, comparison(all, row, now), round2(billed), round2(paid));
    }

    private Comparison comparison(List<HouseholdRow> all, HouseholdRow row, YearMonth ym) {
        List<HouseholdRow> withData = all.stream().filter(h -> h.currentKl() > 0).toList();
        double avg = withData.isEmpty() ? 0 : withData.stream().mapToDouble(HouseholdRow::currentKl).sum() / withData.size();
        int rank = 1 + (int) withData.stream().filter(h -> h.currentKl() > row.currentKl()).count();
        Double vs = avg > 0 && row.currentKl() > 0 ? round2((row.currentKl() - avg) * 100.0 / avg) : null;
        String verdict;
        if (row.currentKl() <= 0) verdict = "No readings this month";
        else if (vs == null) verdict = "Not enough data";
        else if (vs > 50) verdict = "High user — well above the community average";
        else if (vs > 10) verdict = "Above the community average";
        else if (vs < -10) verdict = "Below the community average";
        else verdict = "In line with the community average";
        return new Comparison(ym.toString(), row.currentKl() > 0 ? rank : 0, withData.size(), row.currentKl(), round2(avg), vs, verdict);
    }

    /* =====================  Household CRUD  ===================== */

    @Transactional
    public HouseholdDetail create(HouseholdRequest req) {
        String number = requireText(req.apartmentNumber(), "Apartment / unit number", 20);
        String building = requireText(req.buildingName(), "Building name", 100);
        int floor = floorOf(req.floorNumber());
        String occupancy = occupancyOf(req.occupancyStatus(), "OCCUPIED");
        if (apartmentRepository.existsByApartmentNumberAndBuildingName(number, building))
            throw new BadRequestException("Household " + number + " already exists in " + building + ".");
        if (req.initialReading() != null && (req.initialReading().isNaN() || req.initialReading() < 0 || req.initialReading() > 10_000_000))
            throw new BadRequestException("Initial reading must be a number between 0 and 10,000,000.");

        Apartment apt = apartmentRepository.save(new Apartment(number, building, floor, occupancy));

        if (!Boolean.FALSE.equals(req.createMeter())) {
            String serial = blank(req.meterSerial()) ? generateSerial(building, number) : requireSerial(req.meterSerial(), null);
            WaterMeter meter = new WaterMeter(serial, apt.getApartmentId(), 100, 100, statusOf(req.meterStatus(), "ONLINE"));
            meter = meterRepository.save(meter);
            if (req.initialReading() != null)
                usageRepository.save(new WaterUsage(meter.getMeterId(), req.initialReading(), req.initialReading(), 0.0, LocalDate.now().minusDays(1)));
        } else if (!blank(req.meterSerial())) {
            throw new BadRequestException("Untick 'Create a meter' or remove the meter serial.");
        }

        if (req.resident() != null && (!blank(req.resident().fullName()) || !blank(req.resident().email())))
            addResident(apt.getApartmentId(), req.resident());
        return detail(apt.getApartmentId(), 12);
    }

    @Transactional
    public HouseholdDetail update(Long id, HouseholdRequest req) {
        Apartment apt = requireApartment(id);
        String number = requireText(req.apartmentNumber(), "Apartment / unit number", 20);
        String building = requireText(req.buildingName(), "Building name", 100);
        int floor = floorOf(req.floorNumber());
        String occupancy = occupancyOf(req.occupancyStatus(), apt.getOccupancyStatus());

        Optional<Apartment> clash = apartmentRepository.findByApartmentNumberAndBuildingName(number, building);
        if (clash.isPresent() && !clash.get().getApartmentId().equals(id))
            throw new BadRequestException("Household " + number + " already exists in " + building + ".");

        boolean renamed = !number.equals(apt.getApartmentNumber()) || !building.equals(apt.getBuildingName());
        apt.setApartmentNumber(number);
        apt.setBuildingName(building);
        apt.setFloorNumber(floor);
        apt.setOccupancyStatus(occupancy);
        apartmentRepository.save(apt);
        if (renamed)
            for (Resident r : residentRepository.findByApartmentId(id)) {
                r.setApartmentNumber(number);
                r.setBuildingName(building);
                residentRepository.save(r);
            }

        Optional<WaterMeter> existing = meterRepository.findByApartmentId(id);
        if (existing.isPresent()) {
            WaterMeter m = existing.get();
            if (!blank(req.meterSerial()) && !req.meterSerial().trim().equals(m.getSerialNumber()))
                m.setSerialNumber(requireSerial(req.meterSerial(), m.getMeterId()));
            if (!blank(req.meterStatus())) m.setStatus(statusOf(req.meterStatus(), m.getStatus()));
            meterRepository.save(m);
        } else if (!blank(req.meterSerial())) {
            meterRepository.save(new WaterMeter(requireSerial(req.meterSerial(), null), id, 100, 100, statusOf(req.meterStatus(), "ONLINE")));
        }
        return detail(id, 12);
    }

    /** Refuses when billing history exists — financial records must never silently vanish. */
    @Transactional
    public DeleteResult delete(Long id) {
        Apartment apt = requireApartment(id);
        List<Bill> bills = billRepository.findByApartmentId(id);
        if (!bills.isEmpty())
            throw new BadRequestException("Household " + apt.getApartmentNumber() + " has " + bills.size()
                    + " bill(s) on record, so it can't be deleted. Mark it VACANT instead to keep the billing history.");

        int readings = 0;
        Optional<WaterMeter> meter = meterRepository.findByApartmentId(id);
        if (meter.isPresent()) {
            readings = usageRepository.findByMeterId(meter.get().getMeterId()).size();
            usageRepository.deleteAllByMeterId(meter.get().getMeterId());
            meterRepository.delete(meter.get());
        }
        alertRepository.deleteAll(alertRepository.findByApartmentIdOrderByCreatedAtDesc(id));

        List<Resident> residents = residentRepository.findByApartmentId(id);
        Set<Long> loginIds = new HashSet<>();
        if (apt.getResidentUserId() != null) loginIds.add(apt.getResidentUserId());
        residents.stream().map(Resident::getUserId).filter(Objects::nonNull).forEach(loginIds::add);
        residentRepository.deleteAll(residents);
        loginIds.forEach(this::deleteResidentLogin);

        apartmentRepository.delete(apt);
        return new DeleteResult(apt.getApartmentNumber() + " · " + apt.getBuildingName(), readings, residents.size());
    }

    private String generateSerial(String building, String number) {
        String base = "WM-" + building.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT) + "-"
                + number.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        if (base.length() > 44) base = base.substring(0, 44);
        String serial = base;
        for (int i = 2; meterRepository.findBySerialNumber(serial).isPresent(); i++) serial = base + "-" + i;
        return serial;
    }

    private String requireSerial(String raw, Long selfMeterId) {
        String s = raw.trim();
        if (s.length() > 50) throw new BadRequestException("Meter serial must be 50 characters or fewer.");
        Optional<WaterMeter> clash = meterRepository.findBySerialNumber(s);
        if (clash.isPresent() && !clash.get().getMeterId().equals(selfMeterId))
            throw new BadRequestException("Meter serial '" + s + "' is already assigned to another household.");
        return s;
    }

    /* =====================  Residents within a household  ===================== */

    /** The first resident gets a portal login (the dashboards resolve one login per household); later ones are records only. */
    @Transactional
    public ResidentAdded addResident(Long apartmentId, ResidentRequest req) {
        Apartment apt = requireApartment(apartmentId);
        String name = requireText(req.fullName(), "Resident name", 100);
        String email = validEmail(req.email());
        String phone = validPhone(req.phone());

        // An existing self-registered resident account with no household can be attached to this one.
        boolean makeLogin = apt.getResidentUserId() == null;
        User linkable = makeLogin ? userRepository.findByEmail(email)
                .filter(u -> isResidentOnly(u) && apartmentRepository.findByResidentUserId(u.getUserId()).isEmpty()
                        && residentRepository.findByEmail(email).isEmpty())
                .orElse(null) : null;
        assertEmailFree(email, null, linkable != null ? linkable.getUserId() : null);

        Resident r = new Resident(name, email, phone, apt.getApartmentNumber(), apt.getBuildingName(), "OCCUPIED");
        r.setApartmentId(apartmentId);
        Boolean emailSent = null;
        if (linkable != null) {
            r.setUserId(linkable.getUserId());
            apt.setResidentUserId(linkable.getUserId());
        } else if (makeLogin) {
            String password = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
            User user = new User(name, email, phone, passwordEncoder.encode(password));
            Role role = roleRepository.findByName("ROLE_RESIDENT").orElseGet(() -> roleRepository.save(new Role("ROLE_RESIDENT")));
            user.setRoles(new HashSet<>(Set.of(role)));
            User saved = userRepository.save(user);
            r.setUserId(saved.getUserId());
            apt.setResidentUserId(saved.getUserId());
            if (!Boolean.FALSE.equals(req.sendWelcomeEmail())) {
                ResidentDto dto = new ResidentDto(null, name, email, phone, apt.getApartmentNumber(), apt.getBuildingName(), "OCCUPIED");
                emailSent = emailService.sendResidentWelcomeEmail(dto, password);
            }
        }
        apt.setOccupancyStatus("OCCUPIED");
        apartmentRepository.save(apt);
        Resident saved = residentRepository.save(r);
        return new ResidentAdded(toRow(saved, apt), makeLogin && linkable == null, linkable != null, emailSent);
    }

    @Transactional
    public ResidentRow updateResident(Long apartmentId, Long residentId, ResidentRequest req) {
        Apartment apt = requireApartment(apartmentId);
        Resident r = requireResident(apartmentId, residentId);
        String name = requireText(req.fullName(), "Resident name", 100);
        String email = validEmail(req.email());
        String phone = validPhone(req.phone());
        assertEmailFree(email, residentId, r.getUserId());

        r.setFullName(name);
        r.setEmail(email);
        r.setPhone(phone);
        if (r.getUserId() != null)
            userRepository.findById(r.getUserId()).ifPresent(u -> {
                u.setFullName(name);
                u.setEmail(email);
                u.setPhone(phone);
                userRepository.save(u);
            });
        return toRow(residentRepository.save(r), apt);
    }

    @Transactional
    public void deleteResident(Long apartmentId, Long residentId) {
        Apartment apt = requireApartment(apartmentId);
        Resident r = requireResident(apartmentId, residentId);
        Long loginId = r.getUserId();
        residentRepository.delete(r);
        if (loginId != null) {
            if (Objects.equals(apt.getResidentUserId(), loginId)) apt.setResidentUserId(null);
            deleteResidentLogin(loginId);
        }
        if (residentRepository.findByApartmentId(apartmentId).isEmpty()) apt.setOccupancyStatus("VACANT");
        apartmentRepository.save(apt);
    }

    /** Only ever removes plain resident logins — an admin account can never be deleted through this path. */
    private void deleteResidentLogin(Long userId) {
        userRepository.findById(userId).ifPresent(u -> {
            if (isResidentOnly(u)) userRepository.delete(u);
        });
    }

    private static boolean isResidentOnly(User u) {
        return !u.getRoles().isEmpty() && u.getRoles().stream().allMatch(role -> "ROLE_RESIDENT".equals(role.getName()));
    }

    private Resident requireResident(Long apartmentId, Long residentId) {
        Resident r = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident " + residentId + " not found"));
        if (!apartmentId.equals(r.getApartmentId()))
            throw new BadRequestException("That resident does not belong to this household.");
        return r;
    }

    private void assertEmailFree(String email, Long selfResidentId, Long selfUserId) {
        residentRepository.findByEmail(email).ifPresent(o -> {
            if (!o.getResidentId().equals(selfResidentId)) throw new BadRequestException("A resident with email " + email + " already exists.");
        });
        userRepository.findByEmail(email).ifPresent(o -> {
            if (!o.getUserId().equals(selfUserId)) throw new BadRequestException("A user account with email " + email + " already exists.");
        });
    }

    /* =====================  Startup data repair  ===================== */

    /**
     * Older data links a household to its login user only through apartment.resident_user_id and has no
     * resident row. This creates the missing resident record and fills resident.apartment_id so every
     * dashboard (and the chatbot) sees the same residents. Idempotent; never deletes or overwrites.
     */
    @Transactional
    public int backfillResidents() {
        int changed = 0;
        List<Apartment> apts = apartmentRepository.findAll();
        Map<String, Apartment> byUnit = new HashMap<>();
        for (Apartment a : apts) byUnit.put(unitKey(a.getApartmentNumber(), a.getBuildingName()), a);

        for (Resident r : residentRepository.findAll()) {
            if (r.getApartmentId() != null) continue;
            Apartment a = byUnit.get(unitKey(r.getApartmentNumber(), r.getBuildingName()));
            if (a == null && r.getUserId() != null) a = apts.stream().filter(x -> r.getUserId().equals(x.getResidentUserId())).findFirst().orElse(null);
            if (a != null) {
                r.setApartmentId(a.getApartmentId());
                residentRepository.save(r);
                changed++;
            }
        }
        for (Apartment a : apts) {
            Long uid = a.getResidentUserId();
            if (uid == null) continue;
            boolean has = residentRepository.findByApartmentId(a.getApartmentId()).stream().anyMatch(r -> uid.equals(r.getUserId()));
            if (has) continue;
            Optional<User> u = userRepository.findById(uid);
            if (u.isEmpty()) continue;
            Optional<Resident> sameEmail = residentRepository.findByEmail(u.get().getEmail());
            if (sameEmail.isPresent()) continue;
            Resident r = new Resident(u.get().getFullName(), u.get().getEmail(), u.get().getPhone(), a.getApartmentNumber(), a.getBuildingName(), "OCCUPIED");
            r.setUserId(uid);
            r.setApartmentId(a.getApartmentId());
            residentRepository.save(r);
            changed++;
        }
        return changed;
    }

    private static String unitKey(String number, String building) {
        return (number == null ? "" : number.trim().toLowerCase(Locale.ROOT)) + "|" + (building == null ? "" : building.trim().toLowerCase(Locale.ROOT));
    }

    /* =====================  validation helpers  ===================== */

    private Apartment requireApartment(Long id) {
        return apartmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Household " + id + " not found"));
    }

    private String requireText(String v, String what, int max) {
        if (v == null || v.isBlank()) throw new BadRequestException(what + " is required.");
        String t = v.trim();
        if (t.length() > max) throw new BadRequestException(what + " must be " + max + " characters or fewer.");
        return t;
    }

    private int floorOf(Integer f) {
        if (f == null) return 1;
        if (f < 0 || f > 200) throw new BadRequestException("Floor must be between 0 and 200.");
        return f;
    }

    private String occupancyOf(String v, String fallback) {
        if (blank(v)) return fallback == null ? "OCCUPIED" : fallback;
        String u = v.trim().toUpperCase(Locale.ROOT);
        if (!OCCUPANCY.contains(u)) throw new BadRequestException("Occupancy must be OCCUPIED or VACANT.");
        return u;
    }

    private String statusOf(String v, String fallback) {
        if (blank(v)) return fallback == null ? "ONLINE" : fallback;
        String u = v.trim().toUpperCase(Locale.ROOT);
        if (!METER_STATUS.contains(u)) throw new BadRequestException("Meter status must be ONLINE, OFFLINE or ALERT.");
        return u;
    }

    private String validEmail(String v) {
        String e = requireText(v, "Email", 100).toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(e).matches()) throw new BadRequestException("Enter a valid email address.");
        return e;
    }

    private String validPhone(String v) {
        if (blank(v)) return null;
        String p = v.trim();
        if (!PHONE.matcher(p).matches()) throw new BadRequestException("Phone must be 7–20 characters of digits, spaces, +, - or ().");
        return p;
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) return YearMonth.now();
        try { return YearMonth.parse(month.trim()); }
        catch (Exception e) { throw new BadRequestException("Month must be in YYYY-MM format."); }
    }

    private YearMonth parseBillMonth(String s) {
        if (s == null) return null;
        try { return YearMonth.parse(s.trim(), BILL_MONTH); }
        catch (Exception e) { return null; }
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }
    private static double nz(Double d) { return d == null ? 0 : d; }
    private static double num(Object o) { return o == null ? 0 : ((Number) o).doubleValue(); }
    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
