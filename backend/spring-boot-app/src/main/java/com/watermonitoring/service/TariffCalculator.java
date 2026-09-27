package com.watermonitoring.service;

import com.watermonitoring.entity.TariffPlan;

/**
 * TariffCalculator — Shared 3-tier tariff math, used by both fresh bill
 * generation (BillSchedulerService) and tariff-change recalculation
 * (BillRecalculationService) so the two never drift apart.
 */
public final class TariffCalculator {

    private TariffCalculator() {}

    public static final class Amounts {
        public final Double volumetricAmount;
        public final Double baseCharge;
        public final Double commonWaterCharge;
        public final Double gstAmount;
        public final Double totalAmount;

        public Amounts(Double volumetricAmount, Double baseCharge, Double commonWaterCharge,
                        Double gstAmount, Double totalAmount) {
            this.volumetricAmount = volumetricAmount;
            this.baseCharge = baseCharge;
            this.commonWaterCharge = commonWaterCharge;
            this.gstAmount = gstAmount;
            this.totalAmount = totalAmount;
        }
    }

    public static Amounts calculate(TariffPlan tariff, double consumption, double perUnitBulkShare) {
        double t1Limit = tariff.getTier1LimitKl() != null ? tariff.getTier1LimitKl() : 10.0;
        double t1Rate = tariff.getTier1RatePerKl() != null ? tariff.getTier1RatePerKl() : 5.0;
        double t2Limit = tariff.getTier2LimitKl() != null ? tariff.getTier2LimitKl() : 20.0;
        double t2Rate = tariff.getTier2RatePerKl() != null ? tariff.getTier2RatePerKl() : 15.0;
        double t3Rate = tariff.getTier3RatePerKl() != null ? tariff.getTier3RatePerKl() : 25.0;

        double volumetricAmount;
        if (consumption <= t1Limit) {
            volumetricAmount = consumption * t1Rate;
        } else if (consumption <= t2Limit) {
            double t1Cost = t1Limit * t1Rate;
            double t2Cost = (consumption - t1Limit) * t2Rate;
            volumetricAmount = t1Cost + t2Cost;
        } else {
            double t1Cost = t1Limit * t1Rate;
            double t2Cost = (t2Limit - t1Limit) * t2Rate;
            double t3Cost = (consumption - t2Limit) * t3Rate;
            volumetricAmount = t1Cost + t2Cost + t3Cost;
        }
        volumetricAmount = round2(volumetricAmount);

        Double baseCharge = tariff.getFixedBaseCharge() != null ? tariff.getFixedBaseCharge() : 150.0;
        Double commonWaterCharge = round2((tariff.getCommonWaterCharge() != null ? tariff.getCommonWaterCharge() : 100.0) + perUnitBulkShare);
        double subtotal = volumetricAmount + baseCharge + commonWaterCharge;
        Double gstAmount = round2(subtotal * 0.18);
        Double totalAmount = round2(subtotal + gstAmount);

        return new Amounts(volumetricAmount, baseCharge, commonWaterCharge, gstAmount, totalAmount);
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
