package com.watermonitoring.service;

import com.watermonitoring.entity.Apartment;
import com.watermonitoring.entity.Bill;
import com.watermonitoring.entity.BulkWaterPurchase;
import com.watermonitoring.entity.TariffPlan;
import com.watermonitoring.repository.ApartmentRepository;
import com.watermonitoring.repository.BillRepository;
import com.watermonitoring.repository.BulkWaterPurchaseRepository;
import com.watermonitoring.repository.TariffPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@EnableScheduling
public class BillSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(BillSchedulerService.class);

    private final ApartmentRepository apartmentRepository;
    private final BillRepository billRepository;
    private final TariffPlanRepository tariffRepository;
    private final BulkWaterPurchaseRepository bulkPurchaseRepository;
    private final BillRecalculationService billRecalculationService;

    @Autowired
    public BillSchedulerService(
            ApartmentRepository apartmentRepository,
            BillRepository billRepository,
            TariffPlanRepository tariffRepository,
            BulkWaterPurchaseRepository bulkPurchaseRepository,
            BillRecalculationService billRecalculationService) {
        this.apartmentRepository = apartmentRepository;
        this.billRepository = billRepository;
        this.tariffRepository = tariffRepository;
        this.bulkPurchaseRepository = bulkPurchaseRepository;
        this.billRecalculationService = billRecalculationService;
    }

    /**
     * Automated Cron Job running at 00:00 on the 1st of every month
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    public void scheduleMonthlyBilling() {
        logger.info("[BillScheduler] Triggering automated monthly bill generation...");
        generateMonthlyBills();
    }

    /**
     * Computes and saves monthly bills with Tiered Tariff Engine & Shared Cost Apportionment
     */
    public List<Bill> generateMonthlyBills() {
        return generateMonthlyBills(25.0);
    }

    /**
     * Allocates/recalculates this month's bill for every apartment, one
     * apartment at a time in chronological (registration) order.
     *
     * Never overwrites a bill in place:
     *  - If an apartment has no PENDING bill yet for the current billing
     *    month, a fresh one is inserted.
     *  - If it already has one for the current month (e.g. this is being
     *    re-run after a tariff change) and the recalculated amount is
     *    actually different, the old bill is marked SUPERSEDED (kept,
     *    untouched, for audit) and a brand-new PENDING bill row replaces
     *    it — visible immediately in the resident's Billing History,
     *    with an Alert explaining what changed.
     *  - PENDING bills from a DIFFERENT (earlier) month are left
     *    completely alone — a new month doesn't erase an unpaid old one.
     *  - PAID bills are never touched.
     */
    @Transactional
    public List<Bill> generateMonthlyBills(Double customConsumption) {
        List<Apartment> apartments = apartmentRepository.findAll();
        if (apartments.isEmpty()) {
            Apartment defaultApt = new Apartment("A-402", "Block A", 4, "OCCUPIED");
            apartmentRepository.save(defaultApt);
            apartments = apartmentRepository.findAll();
        }

        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM yyyy"));
        LocalDate dueDate = LocalDate.now().plusDays(15);

        // Fetch Tariff Plan (Fallback to default if not configured)
        TariffPlan tariff = tariffRepository.findByBuildingId(1)
                .orElse(new TariffPlan("Tiered Standard Plan", 1, 10.0, 5.0, 20.0, 15.0, 25.0, 150.0, 100.0));

        // Fetch Bulk Water Purchases for shared cost apportionment
        List<BulkWaterPurchase> bulkPurchases = bulkPurchaseRepository.findAll();
        double totalBulkCost = bulkPurchases.stream().mapToDouble(BulkWaterPurchase::getTotalCost).sum();
        int totalUnits = Math.max(1, apartments.size());
        double perUnitBulkShare = Math.round((totalBulkCost / totalUnits) * 100.0) / 100.0;

        Double consumption = (customConsumption != null && customConsumption > 0) ? customConsumption : 25.0;

        // Allocate bills one apartment at a time, in a deterministic
        // chronological order (by registration date, oldest first) rather
        // than whatever unordered sequence the DB happens to return.
        List<Apartment> orderedApartments = apartments.stream()
                .sorted(Comparator.comparing(Apartment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        List<Bill> resultBills = new ArrayList<>();
        int recalculated = 0;
        int freshlyCreated = 0;

        for (Apartment apartment : orderedApartments) {
            TariffCalculator.Amounts amounts = TariffCalculator.calculate(tariff, consumption, perUnitBulkShare);

            List<Bill> pendingThisMonth = billRepository.findByApartmentId(apartment.getApartmentId()).stream()
                    .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                    .filter(b -> currentMonth.equals(b.getBillingMonth()))
                    .toList();

            if (pendingThisMonth.isEmpty()) {
                Bill saved = billRepository.save(newBillFor(apartment.getApartmentId(), currentMonth, consumption, amounts, dueDate));
                resultBills.add(saved);
                freshlyCreated++;
                continue;
            }

            for (Bill oldBill : pendingThisMonth) {
                if (amounts.totalAmount.equals(oldBill.getTotalAmount())) {
                    // Nothing actually changed for this apartment — leave the existing bill as-is.
                    resultBills.add(oldBill);
                    continue;
                }

                Bill savedNewBill = billRepository.save(
                        newBillFor(apartment.getApartmentId(), currentMonth, consumption, amounts, dueDate));

                oldBill.setStatus("SUPERSEDED");
                oldBill.setSupersededByBillId(savedNewBill.getBillId());
                billRepository.save(oldBill);

                billRecalculationService.notifyResidentOfRecalculation(oldBill, savedNewBill, tariff);

                resultBills.add(savedNewBill);
                recalculated++;
            }
        }

        logger.info("[BillScheduler] {} for {}: {} apartment(s) processed, {} fresh bill(s), {} recalculated (superseded).",
                orderedApartments.size(), currentMonth, orderedApartments.size(), freshlyCreated, recalculated);
        return resultBills;
    }

    private Bill newBillFor(Long apartmentId, String billingMonth, double consumption,
                             TariffCalculator.Amounts amounts, LocalDate dueDate) {
        String billNumber = "BILL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new Bill(
                billNumber,
                apartmentId,
                billingMonth,
                consumption,
                amounts.volumetricAmount,
                amounts.baseCharge,
                amounts.commonWaterCharge,
                amounts.gstAmount,
                amounts.totalAmount,
                dueDate,
                "PENDING"
        );
    }
}
