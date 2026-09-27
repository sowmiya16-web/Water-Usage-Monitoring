package com.watermonitoring.service;

import com.watermonitoring.entity.Alert;
import com.watermonitoring.entity.Bill;
import com.watermonitoring.entity.TariffPlan;
import com.watermonitoring.repository.AlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * BillRecalculationService — Notifies a resident (via an Alert, which
 * shows up in their Resident Portal / Billing History) whenever their
 * bill was recalculated and replaced because of a tariff change.
 * Used by BillSchedulerService's supersede-not-overwrite bill generation.
 */
@Service
public class BillRecalculationService {

    private static final Logger logger = LoggerFactory.getLogger(BillRecalculationService.class);

    private final AlertRepository alertRepository;

    @Autowired
    public BillRecalculationService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public void notifyResidentOfRecalculation(Bill oldBill, Bill newBill, TariffPlan tariff) {
        try {
            String alertRef = "ALT-TARIFF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            String title = "Bill Recalculated — Tariff Updated";
            String message = String.format(
                    "Your bill for %s was recalculated under the new tariff (v%d, effective %s): ₹%.2f → ₹%.2f. New bill: %s.",
                    oldBill.getBillingMonth() != null ? oldBill.getBillingMonth() : "this period",
                    tariff.getVersion(),
                    tariff.getEffectiveFrom() != null ? tariff.getEffectiveFrom().toLocalDate() : "today",
                    oldBill.getTotalAmount(), newBill.getTotalAmount(), newBill.getBillNumber());

            Alert alert = new Alert(
                    alertRef, oldBill.getApartmentId(), null, "BILL_RECALCULATED", title, message,
                    newBill.getTotalAmount(), oldBill.getTotalAmount(), 0.0,
                    newBill.getTotalAmount() - oldBill.getTotalAmount(),
                    "INFO", "ACTIVE", false, newBill.getBillId(), null
            );
            alertRepository.save(alert);
        } catch (Exception e) {
            logger.warn("[BillRecalculation] Could not log recalculation alert for apartment {}: {}",
                    oldBill.getApartmentId(), e.getMessage());
        }
    }
}
