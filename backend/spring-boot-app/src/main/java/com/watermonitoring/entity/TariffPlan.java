package com.watermonitoring.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tariff_plan")
public class TariffPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName = "Tiered Tariff Plan";

    @Column(name = "building_id")
    private Integer buildingId = 1;

    @Column(name = "tier1_limit_kl", nullable = false)
    private Double tier1LimitKl = 10.00;

    @Column(name = "tier1_rate_per_kl", nullable = false)
    private Double tier1RatePerKl = 5.00;

    @Column(name = "tier2_limit_kl", nullable = false)
    private Double tier2LimitKl = 20.00;

    @Column(name = "tier2_rate_per_kl", nullable = false)
    private Double tier2RatePerKl = 15.00;

    @Column(name = "tier3_rate_per_kl", nullable = false)
    private Double tier3RatePerKl = 25.00;

    @Column(name = "fixed_base_charge", nullable = false)
    private Double fixedBaseCharge = 150.00;

    @Column(name = "common_water_charge", nullable = false)
    private Double commonWaterCharge = 100.00;

    // Versioning: every save is a NEW row (see TariffController) — this is
    // the version number within its buildingId, and effectiveFrom is when
    // that version became active. Old versions are never modified, giving
    // a full, timestamped history of every tariff change.
    // Not DB-NOT-NULL: the table may already have rows from before this
    // column existed (Hibernate's ddl-auto=update can't backfill a NOT
    // NULL column against existing data). The Java default (1) covers new
    // rows; getVersion() below covers any pre-existing null.
    @Column(name = "version")
    private Integer version = 1;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public TariffPlan() {}

    public TariffPlan(String planName, Integer buildingId, Double tier1LimitKl, Double tier1RatePerKl, Double tier2LimitKl, Double tier2RatePerKl, Double tier3RatePerKl, Double fixedBaseCharge, Double commonWaterCharge) {
        this.planName = planName;
        this.buildingId = buildingId != null ? buildingId : 1;
        this.tier1LimitKl = tier1LimitKl != null ? tier1LimitKl : 10.0;
        this.tier1RatePerKl = tier1RatePerKl != null ? tier1RatePerKl : 5.0;
        this.tier2LimitKl = tier2LimitKl != null ? tier2LimitKl : 20.0;
        this.tier2RatePerKl = tier2RatePerKl != null ? tier2RatePerKl : 15.0;
        this.tier3RatePerKl = tier3RatePerKl != null ? tier3RatePerKl : 25.0;
        this.fixedBaseCharge = fixedBaseCharge != null ? fixedBaseCharge : 150.0;
        this.commonWaterCharge = commonWaterCharge != null ? commonWaterCharge : 100.0;
    }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public Integer getBuildingId() { return buildingId; }
    public void setBuildingId(Integer buildingId) { this.buildingId = buildingId; }

    public Double getTier1LimitKl() { return tier1LimitKl; }
    public void setTier1LimitKl(Double tier1LimitKl) { this.tier1LimitKl = tier1LimitKl; }

    public Double getTier1RatePerKl() { return tier1RatePerKl; }
    public void setTier1RatePerKl(Double tier1RatePerKl) { this.tier1RatePerKl = tier1RatePerKl; }

    public Double getTier2LimitKl() { return tier2LimitKl; }
    public void setTier2LimitKl(Double tier2LimitKl) { this.tier2LimitKl = tier2LimitKl; }

    public Double getTier2RatePerKl() { return tier2RatePerKl; }
    public void setTier2RatePerKl(Double tier2RatePerKl) { this.tier2RatePerKl = tier2RatePerKl; }

    public Double getTier3RatePerKl() { return tier3RatePerKl; }
    public void setTier3RatePerKl(Double tier3RatePerKl) { this.tier3RatePerKl = tier3RatePerKl; }

    public Double getFixedBaseCharge() { return fixedBaseCharge; }
    public void setFixedBaseCharge(Double fixedBaseCharge) { this.fixedBaseCharge = fixedBaseCharge; }

    public Double getCommonWaterCharge() { return commonWaterCharge; }
    public void setCommonWaterCharge(Double commonWaterCharge) { this.commonWaterCharge = commonWaterCharge; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Integer getVersion() { return version != null ? version : 1; }
    public void setVersion(Integer version) { this.version = version; }

    public LocalDateTime getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDateTime effectiveFrom) { this.effectiveFrom = effectiveFrom; }
}

