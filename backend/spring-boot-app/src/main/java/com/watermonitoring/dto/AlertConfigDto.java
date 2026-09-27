package com.watermonitoring.dto;

public class AlertConfigDto {

    private Double billOverchargeThreshold = 100.0; // ₹ overcharge threshold
    private Double consumptionThresholdKl = 25.0;  // KL consumption threshold
    private Double sigmaMultiplier = 2.0;           // k in (mean + k * stdDev)
    private Boolean enableEmailAlerts = true;

    public AlertConfigDto() {}

    public AlertConfigDto(Double billOverchargeThreshold, Double consumptionThresholdKl, Double sigmaMultiplier, Boolean enableEmailAlerts) {
        this.billOverchargeThreshold = billOverchargeThreshold != null ? billOverchargeThreshold : 100.0;
        this.consumptionThresholdKl = consumptionThresholdKl != null ? consumptionThresholdKl : 25.0;
        this.sigmaMultiplier = sigmaMultiplier != null ? sigmaMultiplier : 2.0;
        this.enableEmailAlerts = enableEmailAlerts != null ? enableEmailAlerts : true;
    }

    public Double getBillOverchargeThreshold() {
        return billOverchargeThreshold;
    }

    public void setBillOverchargeThreshold(Double billOverchargeThreshold) {
        this.billOverchargeThreshold = billOverchargeThreshold;
    }

    public Double getConsumptionThresholdKl() {
        return consumptionThresholdKl;
    }

    public void setConsumptionThresholdKl(Double consumptionThresholdKl) {
        this.consumptionThresholdKl = consumptionThresholdKl;
    }

    public Double getSigmaMultiplier() {
        return sigmaMultiplier;
    }

    public void setSigmaMultiplier(Double sigmaMultiplier) {
        this.sigmaMultiplier = sigmaMultiplier;
    }

    public Boolean getEnableEmailAlerts() {
        return enableEmailAlerts;
    }

    public void setEnableEmailAlerts(Boolean enableEmailAlerts) {
        this.enableEmailAlerts = enableEmailAlerts;
    }
}
