import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityTariff() {
  const [tariffs] = useState([
    { tier: "Tier 1 (Base Lifeline)", range: "0 - 15 KL", rate: "₹35.00 / KL", appliedTo: "All Households", subsidy: "Active (20% Society Rebate)", status: "Active" },
    { tier: "Tier 2 (Standard Usage)", range: "15.1 - 25 KL", rate: "₹45.00 / KL", appliedTo: "Normal Consumption", subsidy: "None", status: "Active" },
    { tier: "Tier 3 (High Consumption)", range: "25.1 - 35 KL", rate: "₹65.00 / KL", appliedTo: "Higher Volume", subsidy: "None", status: "Active" },
    { tier: "Tier 4 (Excessive / Penalized)", range: "> 35 KL", rate: "₹95.00 / KL", appliedTo: "Waste Prevention Tier", subsidy: "Penal Surcharge", status: "Active" },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Tariff Management" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">RATE STRUCTURES</span>
            <h1>Tariff Management</h1>
            <p>Configure volumetric tariff slabs, peak seasonal surcharges, and green conservation incentives</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Edit Tariff Matrix opened.")}
            >
              Configure Tariff Matrix
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>⚙️</div>
              <div className="comm-stat-info">
                <span>Active Model</span>
                <strong>4-Tier Progressive</strong>
                <p>Equitable Slab Structure</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>🌿</div>
              <div className="comm-stat-info">
                <span>Green Incentive</span>
                <strong>-5% Discount</strong>
                <p>For usage under 12 KL/mo</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>⚡</div>
              <div className="comm-stat-info">
                <span>Penal Tier Threshold</span>
                <strong>35.0 KL</strong>
                <p>Triggers Conservation Warning</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>⚖️</div>
              <div className="comm-stat-info">
                <span>Governing Authority</span>
                <strong>Society AGM 2026</strong>
                <p>Approved Rate Schedule</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Current Volumetric Water Slabs</h2>
                <p>Tariff calculation matrix automatically applied to monthly meter readings</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Tariff Tier Name</th>
                    <th>Volume Band (KL)</th>
                    <th>Rate per 1,000 Litres</th>
                    <th>Application Scope</th>
                    <th>Rebate / Surcharge Policy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((t) => (
                    <tr key={t.tier}>
                      <td><strong>{t.tier}</strong></td>
                      <td>{t.range}</td>
                      <td><strong style={{ color: "#078f91" }}>{t.rate}</strong></td>
                      <td>{t.appliedTo}</td>
                      <td>{t.subsidy}</td>
                      <td>
                        <span className="comm-badge badge-success">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CommunityTariff;
