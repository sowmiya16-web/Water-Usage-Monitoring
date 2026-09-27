package com.watermonitoring.service;

import com.watermonitoring.entity.*;
import com.watermonitoring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

/**
 * ResidentComparisonService — compares the signed-in resident's water use with other households.
 *
 * Privacy: only the caller's own apartment is ever returned by identity. Everyone else is reduced to
 * an average, and an average is only published when at least MIN_GROUP other households contributed
 * to it (so a single neighbour's usage can never be read off the response).
 *
 * "Similar households": the schema has no apartment size / occupant count, so the peer group is the
 * resident's own building (block). The whole-community average is provided alongside it.
 */
@Service
public class ResidentComparisonService {

    static final int MIN_GROUP = 3;

    private final ResidentDashboardService dashboardService;
    private final ApartmentRepository apartmentRepository;
    private final WaterMeterRepository meterRepository;
    private final WaterUsageRepository usageRepository;
    private final TariffPlanRepository tariffRepository;

    @Autowired
    public ResidentComparisonService(ResidentDashboardService dashboardService, ApartmentRepository apartmentRepository,
                                     WaterMeterRepository meterRepository, WaterUsageRepository usageRepository,
                                     TariffPlanRepository tariffRepository) {
        this.dashboardService = dashboardService;
        this.apartmentRepository = apartmentRepository;
        this.meterRepository = meterRepository;
        this.usageRepository = usageRepository;
        this.tariffRepository = tariffRepository;
    }

    public record SeriesPoint(String key, String label, Double you, Double yourAverage, Double communityAvg, Double peerAvg) {}
    public record Summary(String period, Double youKl, Double communityAvgKl, Double peerAvgKl,
                          Double diffVsCommunityKl, Double pctVsCommunity, Double diffVsPeersKl, Double pctVsPeers,
                          Integer percentileLower) {}
    public record Insight(String title, String body, String tone) {}
    public record Recommendation(String title, String body, String priority, Double estSavingKlPerMonth) {}
    public record PeerGroup(String buildingLabel, int peerHouseholds, int communityHouseholds,
                            boolean peerAvailable, boolean communityAvailable, boolean peersSameAsCommunity, int minGroupSize) {}
    public record Comparison(String apartment, String building, PeerGroup peerGroup, List<SeriesPoint> daily,
                             List<SeriesPoint> monthly, Summary last30, Summary monthToDate, List<Insight> insights,
                             List<Recommendation> recommendations, Double estMonthlySavingRupees, List<String> notes) {}

    @Transactional(readOnly = true)
    public Comparison build(String email) {
        Apartment me = dashboardService.resolveApartment(email);
        if (me == null) {
            return new Comparison(null, null, new PeerGroup(null, 0, 0, false, false, false, MIN_GROUP), List.of(), List.of(),
                    null, null, List.of(new Insight("No household linked", "Your account isn't linked to an apartment yet.", "info")),
                    List.of(), null, List.of());
        }

        // apartmentId -> (date -> KL), for the last ~6 months, one pass over readings
        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.from(today);
        LocalDate from = thisMonth.minusMonths(5).atDay(1);
        Map<Long, Long> aptByMeter = new HashMap<>();
        for (WaterMeter m : meterRepository.findAll()) if (m.getApartmentId() != null) aptByMeter.put(m.getMeterId(), m.getApartmentId());
        Map<Long, Map<LocalDate, Double>> usage = new HashMap<>();
        for (WaterUsage u : usageRepository.findByReadingDateBetween(from, today)) {
            Long apt = aptByMeter.get(u.getMeterId());
            if (apt == null || u.getReadingDate() == null || u.getConsumptionKl() == null) continue;
            usage.computeIfAbsent(apt, k -> new HashMap<>()).merge(u.getReadingDate(), u.getConsumptionKl(), Double::sum);
        }

        Long myId = me.getApartmentId();
        Map<Long, Apartment> apartments = new HashMap<>();
        for (Apartment a : apartmentRepository.findAll()) apartments.put(a.getApartmentId(), a);
        Set<Long> others = new HashSet<>();      // every other household with readings
        Set<Long> peers = new HashSet<>();       // ... in the same building
        for (Long id : usage.keySet()) {
            if (id.equals(myId)) continue;
            others.add(id);
            Apartment a = apartments.get(id);
            if (a != null && Objects.equals(a.getBuildingName(), me.getBuildingName())) peers.add(id);
        }
        boolean communityOk = others.size() >= MIN_GROUP;
        // Publishing both a building average and a community average would let their difference isolate a few
        // households, so the building figure is only released when the rest of the community is empty or big enough.
        int rest = others.size() - peers.size();
        boolean peerOk = peers.size() >= MIN_GROUP && (rest == 0 || rest >= MIN_GROUP);
        if (!peerOk) peers = new HashSet<>();
        PeerGroup group = new PeerGroup(me.getBuildingName(), peerOk ? peers.size() : 0, others.size(), peerOk, communityOk,
                peerOk && peers.equals(others), MIN_GROUP);

        Map<LocalDate, Double> mine = usage.getOrDefault(myId, Map.of());

        // ---- daily: last 30 days
        double myAvg30 = average(mine, today.minusDays(29), today);
        List<SeriesPoint> daily = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            daily.add(new SeriesPoint(d.toString(), d.getDayOfMonth() + " " + d.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    r(mine.get(d)), myAvg30 > 0 ? r(myAvg30) : null, groupAvgDay(usage, others, d), groupAvgDay(usage, peers, d)));
        }

        // ---- monthly: last 6 months (current month is month-to-date for everyone)
        List<SeriesPoint> monthly = new ArrayList<>();
        double myMonthlyAvg = 0; int mCount = 0;
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = thisMonth.minusMonths(i);
            Double v = total(mine, ym.atDay(1), ym.atEndOfMonth());
            if (v != null) { myMonthlyAvg += v; mCount++; }
        }
        myMonthlyAvg = mCount > 0 ? myMonthlyAvg / mCount : 0;
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = thisMonth.minusMonths(i);
            LocalDate s = ym.atDay(1), e = ym.atEndOfMonth();
            monthly.add(new SeriesPoint(ym.toString(), ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear() % 100,
                    r(total(mine, s, e)), myMonthlyAvg > 0 ? r(myMonthlyAvg) : null,
                    groupAvgTotal(usage, others, s, e), groupAvgTotal(usage, peers, s, e)));
        }

        Summary last30 = summary("Last 30 days", usage, myId, others, peers, today.minusDays(29), today);
        Summary mtd = summary("This month so far", usage, myId, others, peers, thisMonth.atDay(1), today);

        List<Insight> insights = new ArrayList<>();
        List<Recommendation> recs = new ArrayList<>();
        Double savingRupees = analyse(me, mine, last30, group, today, insights, recs);

        List<String> notes = new ArrayList<>();
        notes.add("Households are grouped by building because apartment size isn't recorded. Compare like with like: differences can reflect household size.");
        notes.add("Averages are only shown when at least " + MIN_GROUP + " other households have readings, so no individual neighbour can be identified.");
        if (!communityOk) notes.add("Only " + others.size() + " other household" + (others.size() == 1 ? " has" : "s have")
                + " readings, so community and neighbour comparisons will appear once " + MIN_GROUP + " others are reporting. Your own 30-day and 6-month averages are shown meanwhile.");

        return new Comparison(me.getApartmentNumber(), me.getBuildingName(), group, daily, monthly, last30, mtd, insights, recs, savingRupees, notes);
    }

    /* ---------------- insights & recommendations ---------------- */

    private Double analyse(Apartment me, Map<LocalDate, Double> mine, Summary s30, PeerGroup group, LocalDate today,
                           List<Insight> insights, List<Recommendation> recs) {
        Double you = s30.youKl();
        if (you == null || you <= 0) {
            insights.add(new Insight("No recent readings", "We have no meter readings for your household in the last 30 days, so there is nothing to compare yet.", "info"));
            return null;
        }
        // Prefer the neighbour (building) figure, fall back to community
        Double ref = s30.peerAvgKl() != null ? s30.peerAvgKl() : s30.communityAvgKl();
        Double pct = s30.peerAvgKl() != null ? s30.pctVsPeers() : s30.pctVsCommunity();
        String refName = s30.peerAvgKl() != null ? "similar households in " + me.getBuildingName() : "the community average";

        double excess30 = 0;
        if (ref != null && pct != null) {
            double abs = Math.abs(pct);
            if (pct <= -10) {
                insights.add(new Insight("Better than average", "You used " + f(abs) + "% less water than " + refName + " over the last 30 days (" + f(you) + " KL vs " + f(ref) + " KL).", "good"));
                recs.add(new Recommendation("Keep it up", "Your usage is well below " + refName + ". Keep your habits and check monthly that nothing changes.", "low", null));
            } else if (pct < 10) {
                insights.add(new Insight("In line with others", "Your usage is within 10% of " + refName + " (" + f(you) + " KL vs " + f(ref) + " KL).", "info"));
            } else {
                excess30 = you - ref;
                insights.add(new Insight(pct >= 25 ? "Well above average" : "Above average",
                        "You used " + f(abs) + "% more water than " + refName + " over the last 30 days: " + f(you) + " KL vs " + f(ref) + " KL, about " + f(excess30) + " KL more.",
                        pct >= 25 ? "high" : "warn"));
                recs.add(new Recommendation("Aim for about " + f(ref / 30.0) + " KL a day",
                        "Matching " + refName + " means trimming roughly " + f(excess30 / 30.0 * 1000) + " litres a day. Start with the tips below.",
                        pct >= 25 ? "high" : "medium", r(excess30)));
            }
        }

        // No neighbour/community figure available yet: compare with the resident's own previous 30 days
        if (ref == null) {
            Double prev30 = total(mine, today.minusDays(59), today.minusDays(30));
            if (prev30 != null && prev30 > 0) {
                double t = (you - prev30) * 100.0 / prev30;
                if (t >= 10) insights.add(new Insight("Higher than your previous 30 days", "You used " + f(you) + " KL in the last 30 days, " + f(t) + "% more than the 30 days before (" + f(prev30) + " KL).", "warn"));
                else if (t <= -10) insights.add(new Insight("Lower than your previous 30 days", "You used " + f(you) + " KL in the last 30 days, " + f(-t) + "% less than the 30 days before (" + f(prev30) + " KL).", "good"));
                else insights.add(new Insight("Steady usage", "Your last 30 days (" + f(you) + " KL) are within 10% of the 30 days before (" + f(prev30) + " KL).", "info"));
            }
        }

        // trend: last 7 days vs the 23 days before
        double last7 = average(mine, today.minusDays(6), today), prev23 = average(mine, today.minusDays(29), today.minusDays(7));
        if (last7 > 0 && prev23 > 0) {
            double t = (last7 - prev23) * 100.0 / prev23;
            if (t >= 15) insights.add(new Insight("Usage is rising", "Your daily use over the last 7 days (" + f(last7) + " KL) is " + f(t) + "% higher than the 3 weeks before.", "warn"));
            else if (t <= -10) insights.add(new Insight("Usage is falling", "Your daily use this week (" + f(last7) + " KL) is " + f(-t) + "% lower than the 3 weeks before. Nice work.", "good"));
        }

        // weekend vs weekday
        double wkd = 0, wke = 0; int nd = 0, ne = 0;
        for (int i = 0; i < 30; i++) {
            LocalDate d = today.minusDays(i); Double v = mine.get(d); if (v == null) continue;
            if (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) { wke += v; ne++; } else { wkd += v; nd++; }
        }
        if (nd >= 5 && ne >= 2 && wkd > 0) {
            double a = wkd / nd, b = wke / ne;
            if (b >= a * 1.25) {
                insights.add(new Insight("Weekends use more", "Your weekend days average " + f(b) + " KL versus " + f(a) + " KL on weekdays (" + f((b - a) * 100 / a) + "% more).", "info"));
                recs.add(new Recommendation("Spread out weekend chores", "Run full loads of laundry and dishes, wash the car with a bucket, and avoid leaving taps running during weekend cleaning.", "medium", null));
            }
        }

        // spikes: days above 2x own average
        double avg = average(mine, today.minusDays(29), today);
        int spikes = 0; double maxDay = 0; LocalDate maxDate = null;
        for (int i = 0; i < 30; i++) {
            LocalDate d = today.minusDays(i); Double v = mine.get(d);
            if (v != null && avg > 0 && v > avg * 2) { spikes++; if (v > maxDay) { maxDay = v; maxDate = d; } }
        }
        if (spikes > 0) {
            insights.add(new Insight("Unusual high-use days", spikes + " day" + (spikes > 1 ? "s were" : " was") + " more than double your normal use; the highest was " + f(maxDay) + " KL on " + maxDate + ".", "warn"));
            recs.add(new Recommendation("Check for leaks", "Turn off every tap and appliance and see whether the meter still moves. Test toilet cisterns with a few drops of food colour (colour in the bowl without flushing means a leak).", "high", null));
        }

        if (ref != null && pct != null && pct >= 10) {
            recs.add(new Recommendation("Shorter showers & aerators", "Cutting a shower by 2 minutes and fitting tap aerators can save 10 to 15% of household water.", "medium", r(you * 0.10)));
            recs.add(new Recommendation("Fix drips and running toilets", "A dripping tap can waste over 5 litres an hour and a running toilet far more. Repair them promptly.", "medium", null));
        } else {
            recs.add(new Recommendation("Reuse where you can", "Use RO reject or rinse water for plants and floor cleaning to keep your usage low.", "low", null));
        }
        if (recs.size() > 5) recs.subList(5, recs.size()).clear();

        // ₹ estimate: excess KL per 30 days at the marginal tier rate of the resident's projected usage
        if (excess30 > 0) {
            Optional<TariffPlan> tp = tariffRepository.findByBuildingId(1);
            if (tp.isPresent()) {
                TariffPlan t = tp.get();
                double rate = you <= t.getTier1LimitKl() ? t.getTier1RatePerKl() : you <= t.getTier2LimitKl() ? t.getTier2RatePerKl() : t.getTier3RatePerKl();
                return r(excess30 * rate);
            }
        }
        return null;
    }

    /* ---------------- helpers ---------------- */

    private Summary summary(String period, Map<Long, Map<LocalDate, Double>> usage, Long myId, Set<Long> others, Set<Long> peers,
                            LocalDate s, LocalDate e) {
        Double you = total(usage.getOrDefault(myId, Map.of()), s, e);
        Double comm = groupAvgTotal(usage, others, s, e), peer = groupAvgTotal(usage, peers, s, e);
        Integer pctl = null;
        if (you != null && others.size() >= MIN_GROUP) {
            int higher = 0, counted = 0;
            for (Long id : others) { Double v = total(usage.getOrDefault(id, Map.of()), s, e); if (v == null) continue; counted++; if (v > you) higher++; }
            if (counted >= MIN_GROUP) pctl = (int) Math.round(higher * 100.0 / counted);
        }
        return new Summary(period, r(you), comm, peer,
                you != null && comm != null ? r(you - comm) : null, you != null && comm != null && comm > 0 ? r((you - comm) * 100 / comm) : null,
                you != null && peer != null ? r(you - peer) : null, you != null && peer != null && peer > 0 ? r((you - peer) * 100 / peer) : null, pctl);
    }

    /** Average of the group's usage on one day — only if at least MIN_GROUP households reported that day. */
    private Double groupAvgDay(Map<Long, Map<LocalDate, Double>> usage, Set<Long> group, LocalDate d) {
        double sum = 0; int n = 0;
        for (Long id : group) { Double v = usage.getOrDefault(id, Map.of()).get(d); if (v != null) { sum += v; n++; } }
        return n >= MIN_GROUP ? r(sum / n) : null;
    }

    /** Average per-household total over a date range — only if at least MIN_GROUP households have readings in it. */
    private Double groupAvgTotal(Map<Long, Map<LocalDate, Double>> usage, Set<Long> group, LocalDate s, LocalDate e) {
        double sum = 0; int n = 0;
        for (Long id : group) { Double v = total(usage.getOrDefault(id, Map.of()), s, e); if (v != null) { sum += v; n++; } }
        return n >= MIN_GROUP ? r(sum / n) : null;
    }

    private Double total(Map<LocalDate, Double> m, LocalDate s, LocalDate e) {
        double sum = 0; boolean any = false;
        for (Map.Entry<LocalDate, Double> en : m.entrySet())
            if (!en.getKey().isBefore(s) && !en.getKey().isAfter(e)) { sum += en.getValue(); any = true; }
        return any ? sum : null;
    }

    private double average(Map<LocalDate, Double> m, LocalDate s, LocalDate e) {
        double sum = 0; int n = 0;
        for (Map.Entry<LocalDate, Double> en : m.entrySet())
            if (!en.getKey().isBefore(s) && !en.getKey().isAfter(e)) { sum += en.getValue(); n++; }
        return n > 0 ? sum / n : 0;
    }

    private static Double r(Double v) { return v == null ? null : Math.round(v * 100.0) / 100.0; }
    private static Double r(double v) { return Math.round(v * 100.0) / 100.0; }
    private static String f(double v) { return String.format(Locale.ENGLISH, "%.1f", v); }
}
