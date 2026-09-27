import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import tariffService from "../../../services/tariffService";
import billService from "../../../services/billService";

import "./TariffManagement.css";

function TariffManagement() {
  const navigate = useNavigate();

  // Tier Configuration Form State
  const [tariffConfig, setTariffConfig] = useState({
    planId: null,
    planName: "Standard Tiered Tariff Plan 2026",
    buildingId: 1,
    tier1LimitKl: 10,
    tier1RatePerKl: 5,
    tier2LimitKl: 20,
    tier2RatePerKl: 15,
    tier3RatePerKl: 25,
    fixedBaseCharge: 150,
    commonWaterCharge: 100,
  });

  // Real-Time Simulator State
  const [simulatedConsumption, setSimulatedConsumption] = useState(25);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch active tariff plan from backend on component mount
  useEffect(() => {
    fetchActiveTariff();
  }, []);

  const fetchActiveTariff = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await tariffService.getTariffByBuilding(1);
      if (res && res.data) {
        setTariffConfig({
          planId: res.data.planId || null,
          planName: res.data.planName || "Standard Tiered Tariff Plan 2026",
          buildingId: res.data.buildingId || 1,
          tier1LimitKl: res.data.tier1LimitKl ?? 10,
          tier1RatePerKl: res.data.tier1RatePerKl ?? 5,
          tier2LimitKl: res.data.tier2LimitKl ?? 20,
          tier2RatePerKl: res.data.tier2RatePerKl ?? 15,
          tier3RatePerKl: res.data.tier3RatePerKl ?? 25,
          fixedBaseCharge: res.data.fixedBaseCharge ?? 150,
          commonWaterCharge: res.data.commonWaterCharge ?? 100,
        });
      }
    } catch (err) {
      console.error("Error loading tariff configuration:", err);
      // Fallback defaults if backend call fails
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    const numericValue = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
    setTariffConfig((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  // REAL-TIME TARIFF ENGINE CALCULATIONS
  const calculation = useMemo(() => {
    const c = Math.max(0, parseFloat(simulatedConsumption) || 0);
    const t1Limit = Math.max(0, parseFloat(tariffConfig.tier1LimitKl) || 0);
    const t1Rate = Math.max(0, parseFloat(tariffConfig.tier1RatePerKl) || 0);
    const t2Limit = Math.max(t1Limit, parseFloat(tariffConfig.tier2LimitKl) || 0);
    const t2Rate = Math.max(0, parseFloat(tariffConfig.tier2RatePerKl) || 0);
    const t3Rate = Math.max(0, parseFloat(tariffConfig.tier3RatePerKl) || 0);
    const base = Math.max(0, parseFloat(tariffConfig.fixedBaseCharge) || 0);
    const common = Math.max(0, parseFloat(tariffConfig.commonWaterCharge) || 0);

    let t1Units = 0;
    let t1Cost = 0;
    let t2Units = 0;
    let t2Cost = 0;
    let t3Units = 0;
    let t3Cost = 0;

    if (c <= t1Limit) {
      t1Units = c;
      t1Cost = t1Units * t1Rate;
    } else if (c <= t2Limit) {
      t1Units = t1Limit;
      t1Cost = t1Units * t1Rate;
      t2Units = c - t1Limit;
      t2Cost = t2Units * t2Rate;
    } else {
      t1Units = t1Limit;
      t1Cost = t1Units * t1Rate;
      t2Units = t2Limit - t1Limit;
      t2Cost = t2Units * t2Rate;
      t3Units = c - t2Limit;
      t3Cost = t3Units * t3Rate;
    }

    const volumetricTotal = t1Cost + t2Cost + t3Cost;
    const subtotal = volumetricTotal + base + common;
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;

    // Active Tier Classification String
    let activeTierName = "Tier 1";
    if (c > t2Limit) activeTierName = "Tier 3";
    else if (c > t1Limit) activeTierName = "Tier 2";

    return {
      t1Units,
      t1Cost,
      t2Units,
      t2Cost,
      t3Units,
      t3Cost,
      volumetricTotal,
      base,
      common,
      subtotal,
      gst,
      grandTotal,
      activeTierName,
    };
  }, [tariffConfig, simulatedConsumption]);

  // Save Tariff Configuration to Backend Database & Generate Resident Bills
  const handleSaveTariff = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        ...tariffConfig,
        buildingId: 1,
      };

      const res = await tariffService.saveTariff(payload, simulatedConsumption);
      if (res && res.success) {
        if (res.data && res.data.planId) {
          setTariffConfig((prev) => ({ ...prev, planId: res.data.planId }));
        }

        // Generate resident bills automatically using new saved 3-tier rates and target consumption
        try {
          await billService.generateMonthlyBills(simulatedConsumption);
        } catch (bErr) {
          console.warn("Bill generation trigger warning:", bErr);
        }

        setSaveSuccessMsg(
          `✓ Tariff Plan & 3-Tier Rates saved to Database! Bill generated in database and dynamically pushed to Resident Portal (Billing History).`
        );
      } else {
        setErrorMsg(res?.message || "Failed to update tariff plan in backend.");
      }
    } catch (err) {
      console.error("Failed to save tariff configuration:", err);
      setErrorMsg("Error communicating with Spring Boot tariff service.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-tariff-page">
      <AdminSidebar activePage="Tariff Management" onLogout={handleLogout} />

      <main className="admin-tariff-main">
        <div className="admin-tariff-content">
          {/* HEADING */}
          <div className="admin-page-heading">
            <div>
              <span className="admin-section-label">BILLING & PAYMENTS SYSTEM</span>
              <h2>Tier-Based Tariff Configuration</h2>
              <p>Configure 3-Tier progressive rate rules, fixed charges, and test dynamic real-time calculations.</p>
            </div>
            <div className="tariff-effective-badge">
              <span>ACTIVE DATABASE PLAN</span>
              <strong>{loading ? "Loading..." : tariffConfig.planName}</strong>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="tariff-alert-success">
              {saveSuccessMsg}
            </div>
          )}

          {errorMsg && (
            <div className="tariff-alert-error">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* MAIN CONFIGURATION & REAL-TIME CALCULATOR GRID */}
          <div className="tariff-two-col-grid">
            {/* LEFT COLUMN: TIER CONFIGURATION FORM */}
            <div className="tariff-config-col">
              <form onSubmit={handleSaveTariff} className="tariff-form-card">
                <div className="card-heading-bar">
                  <div>
                    <h3>⚙️ Configure Tariff Rules & Tier Limits</h3>
                    <p>Set custom thresholds and rate per unit for each consumption tier.</p>
                  </div>
                  <button type="submit" className="btn-save-tariff" disabled={saving}>
                    {saving ? "Saving to DB..." : "💾 Save Tariff Plan"}
                  </button>
                </div>

                {/* TIER 1 CONFIGURATION */}
                <div className="tier-config-box tier-1-box">
                  <div className="tier-box-header">
                    <span className="tier-badge t1">TIER 1</span>
                    <h4>Initial Consumption Band (0 – {tariffConfig.tier1LimitKl} Units)</h4>
                  </div>
                  <div className="tier-fields-grid">
                    <div className="form-field">
                      <label>Tier 1 Limit (Units / KL)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={tariffConfig.tier1LimitKl}
                          onChange={(e) => handleInputChange("tier1LimitKl", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">KL / Units</span>
                      </div>
                      <small>Usage from 0 to {tariffConfig.tier1LimitKl} units</small>
                    </div>

                    <div className="form-field">
                      <label>Tier 1 Unit Price (₹ / Unit)</label>
                      <div className="input-with-unit">
                        <span className="currency-prefix">₹</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={tariffConfig.tier1RatePerKl}
                          onChange={(e) => handleInputChange("tier1RatePerKl", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">/ Unit</span>
                      </div>
                      <small>e.g. 10 Units @ ₹{tariffConfig.tier1RatePerKl} = ₹{(tariffConfig.tier1LimitKl * tariffConfig.tier1RatePerKl).toFixed(2)}</small>
                    </div>
                  </div>
                </div>

                {/* TIER 2 CONFIGURATION */}
                <div className="tier-config-box tier-2-box">
                  <div className="tier-box-header">
                    <span className="tier-badge t2">TIER 2</span>
                    <h4>Medium Consumption Band ({tariffConfig.tier1LimitKl} – {tariffConfig.tier2LimitKl} Units)</h4>
                  </div>
                  <div className="tier-fields-grid">
                    <div className="form-field">
                      <label>Tier 2 Upper Limit (Units / KL)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          step="1"
                          min={tariffConfig.tier1LimitKl + 1}
                          value={tariffConfig.tier2LimitKl}
                          onChange={(e) => handleInputChange("tier2LimitKl", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">KL / Units</span>
                      </div>
                      <small>Usage above {tariffConfig.tier1LimitKl} up to {tariffConfig.tier2LimitKl} units</small>
                    </div>

                    <div className="form-field">
                      <label>Tier 2 Unit Price (₹ / Unit)</label>
                      <div className="input-with-unit">
                        <span className="currency-prefix">₹</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={tariffConfig.tier2RatePerKl}
                          onChange={(e) => handleInputChange("tier2RatePerKl", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">/ Unit</span>
                      </div>
                      <small>e.g. 10 Units @ ₹{tariffConfig.tier2RatePerKl} = ₹{((tariffConfig.tier2LimitKl - tariffConfig.tier1LimitKl) * tariffConfig.tier2RatePerKl).toFixed(2)}</small>
                    </div>
                  </div>
                </div>

                {/* TIER 3 CONFIGURATION */}
                <div className="tier-config-box tier-3-box">
                  <div className="tier-box-header">
                    <span className="tier-badge t3">TIER 3</span>
                    <h4>High Consumption Band (Above {tariffConfig.tier2LimitKl} Units)</h4>
                  </div>
                  <div className="tier-fields-grid">
                    <div className="form-field">
                      <label>Tier 3 Starting Limit</label>
                      <div className="input-with-unit disabled-input">
                        <input type="text" value={`> ${tariffConfig.tier2LimitKl} Units`} disabled />
                        <span className="unit-suffix">Auto</span>
                      </div>
                      <small>Applies to all consumption exceeding {tariffConfig.tier2LimitKl} units</small>
                    </div>

                    <div className="form-field">
                      <label>Tier 3 Unit Price (₹ / Unit)</label>
                      <div className="input-with-unit">
                        <span className="currency-prefix">₹</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={tariffConfig.tier3RatePerKl}
                          onChange={(e) => handleInputChange("tier3RatePerKl", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">/ Unit</span>
                      </div>
                      <small>Excess usage penalty rate per unit</small>
                    </div>
                  </div>
                </div>

                {/* FIXED & COMMUNITY CHARGES */}
                <div className="tier-config-box fixed-box">
                  <div className="tier-box-header">
                    <span className="tier-badge fixed">FIXED FEES</span>
                    <h4>Fixed Base Charges & Shared Amenities</h4>
                  </div>
                  <div className="tier-fields-grid">
                    <div className="form-field">
                      <label>Fixed Base Infrastructure Fee (₹)</label>
                      <div className="input-with-unit">
                        <span className="currency-prefix">₹</span>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={tariffConfig.fixedBaseCharge}
                          onChange={(e) => handleInputChange("fixedBaseCharge", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">/ Month</span>
                      </div>
                      <small>Fixed monthly meter maintenance charge</small>
                    </div>

                    <div className="form-field">
                      <label>Common Water Charge (₹)</label>
                      <div className="input-with-unit">
                        <span className="currency-prefix">₹</span>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={tariffConfig.commonWaterCharge}
                          onChange={(e) => handleInputChange("commonWaterCharge", e.target.value)}
                          required
                        />
                        <span className="unit-suffix">/ Month</span>
                      </div>
                      <small>Shared landscaping & common utility charge</small>
                    </div>
                  </div>
                </div>

                <div className="form-submit-footer">
                  <button type="submit" className="btn-save-tariff-main" disabled={saving}>
                    {saving ? "Saving to Database..." : "💾 Save Tariff Plan & Apply to System"}
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: REAL-TIME TARIFF CALCULATOR / SIMULATOR */}
            <div className="tariff-simulator-col">
              <div className="simulator-card">
                <div className="simulator-header">
                  <div className="sim-badge">REAL-TIME TARIFF SIMULATOR</div>
                  <h3>⚡ Dynamic Live Tariff Calculator</h3>
                  <p>Adjust sample consumption units to watch real-time tier breakdown calculations instantly update.</p>
                </div>

                {/* SIMULATOR CONTROLS */}
                <div className="sim-input-box">
                  <div className="sim-label-row">
                    <label>Test Consumption Volume:</label>
                    <strong className="sim-value-highlight">{simulatedConsumption} KL / Units</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={simulatedConsumption}
                    onChange={(e) => setSimulatedConsumption(parseFloat(e.target.value))}
                    className="sim-slider"
                  />
                  <div className="quick-sim-buttons">
                    <button type="button" onClick={() => setSimulatedConsumption(5)}>5 Units (Tier 1)</button>
                    <button type="button" onClick={() => setSimulatedConsumption(15)}>15 Units (Tier 2)</button>
                    <button type="button" onClick={() => setSimulatedConsumption(25)}>25 Units (Tier 3)</button>
                    <button type="button" onClick={() => setSimulatedConsumption(35)}>35 Units (High)</button>
                  </div>
                </div>

                {/* CURRENT APPLICABLE TIER BANNER */}
                <div className="applicable-tier-banner">
                  <span>Usage Classification:</span>
                  <strong className={`tier-tag-banner ${calculation.activeTierName.toLowerCase().replace(" ", "")}`}>
                    {calculation.activeTierName} Target Range
                  </strong>
                </div>

                {/* ITEMIZATION BREAKDOWN TABLE */}
                <div className="sim-breakdown-card">
                  <h4>Calculation Formula Breakdown</h4>

                  <div className="sim-breakdown-row">
                    <div>
                      <strong>Tier 1 (0 – {tariffConfig.tier1LimitKl} Units)</strong>
                      <small>{calculation.t1Units.toFixed(1)} Units × ₹{tariffConfig.tier1RatePerKl}/Unit</small>
                    </div>
                    <span className="sim-row-amount">₹{calculation.t1Cost.toFixed(2)}</span>
                  </div>

                  <div className="sim-breakdown-row">
                    <div>
                      <strong>Tier 2 ({tariffConfig.tier1LimitKl} – {tariffConfig.tier2LimitKl} Units)</strong>
                      <small>{calculation.t2Units.toFixed(1)} Units × ₹{tariffConfig.tier2RatePerKl}/Unit</small>
                    </div>
                    <span className="sim-row-amount">₹{calculation.t2Cost.toFixed(2)}</span>
                  </div>

                  <div className="sim-breakdown-row">
                    <div>
                      <strong>Tier 3 (Above {tariffConfig.tier2LimitKl} Units)</strong>
                      <small>{calculation.t3Units.toFixed(1)} Units × ₹{tariffConfig.tier3RatePerKl}/Unit</small>
                    </div>
                    <span className="sim-row-amount">₹{calculation.t3Cost.toFixed(2)}</span>
                  </div>

                  <div className="sim-divider"></div>

                  <div className="sim-breakdown-row sub-row">
                    <span>Volumetric Subtotal</span>
                    <span>₹{calculation.volumetricTotal.toFixed(2)}</span>
                  </div>

                  <div className="sim-breakdown-row sub-row">
                    <span>Fixed Infrastructure Charge</span>
                    <span>₹{calculation.base.toFixed(2)}</span>
                  </div>

                  <div className="sim-breakdown-row sub-row">
                    <span>Common Water Charge</span>
                    <span>₹{calculation.common.toFixed(2)}</span>
                  </div>

                  <div className="sim-breakdown-row sub-row">
                    <span>GST Tax (18%)</span>
                    <span>₹{calculation.gst.toFixed(2)}</span>
                  </div>

                  <div className="sim-total-box">
                    <div>
                      <span>ESTIMATED TOTAL BILL</span>
                      <small>Real-Time Dynamic Result</small>
                    </div>
                    <strong className="sim-grand-total">₹{calculation.grandTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="sim-footer-note">
                  💡 <strong>How it works:</strong> As Admin changes tier rates on the left, this panel dynamically evaluates the applicable tier brackets and updates real-time formulas.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TariffManagement;
