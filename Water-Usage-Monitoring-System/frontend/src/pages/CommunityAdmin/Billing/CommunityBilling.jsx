import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityBilling() {
  const [invoices] = useState([
    { id: "INV-2026-081", resident: "Sowmiya (A-402)", period: "August 2026", volume: "18.6 KL", amount: "₹837.00", status: "Paid", paidOn: "30 Aug 2026", method: "UPI GPay" },
    { id: "INV-2026-082", resident: "Rahul Sharma (A-101)", period: "August 2026", volume: "21.3 KL", amount: "₹958.50", status: "Paid", paidOn: "29 Aug 2026", method: "NetBanking" },
    { id: "INV-2026-083", resident: "Priya Sundaram (B-203)", period: "August 2026", volume: "26.4 KL", amount: "₹1,188.00", status: "Pending", paidOn: "-", method: "-" },
    { id: "INV-2026-084", resident: "Vikram Rathore (C-305)", period: "August 2026", volume: "14.2 KL", amount: "₹639.00", status: "Paid", paidOn: "28 Aug 2026", method: "Credit Card" },
    { id: "INV-2026-085", resident: "Meenakshi Devi (A-102)", period: "August 2026", volume: "22.8 KL", amount: "₹1,026.00", status: "Overdue", paidOn: "-", method: "-" },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Billing & Payments" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">FINANCIAL SETTLEMENTS</span>
            <h1>Billing &amp; Payments</h1>
            <p>Supervise monthly water billing generation, resident payment ledgers, and revenue balances</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Generate Invoices cycle triggered.")}
            >
              + Generate Society Cycle
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>💳</div>
              <div className="comm-stat-info">
                <span>Total Billed</span>
                <strong>₹1,24,500</strong>
                <p>142 Generated Invoices</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>₹</div>
              <div className="comm-stat-info">
                <span>Collected</span>
                <strong>₹1,17,280</strong>
                <p>94.2% Cleared Through Gateways</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>⏳</div>
              <div className="comm-stat-info">
                <span>Pending Balance</span>
                <strong>₹7,220</strong>
                <p>8 Reminders Dispatched</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>🧾</div>
              <div className="comm-stat-info">
                <span>Average Bill</span>
                <strong>₹876.76</strong>
                <p>Per Household Monthly</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Recent Invoices &amp; Payment Receipts</h2>
                <p>Real-time transaction entries across resident units</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Resident / Unit</th>
                    <th>Period</th>
                    <th>Volume Used</th>
                    <th>Amount (INR)</th>
                    <th>Payment Status</th>
                    <th>Payment Date</th>
                    <th>Gateway Method</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{inv.id}</td>
                      <td><strong>{inv.resident}</strong></td>
                      <td>{inv.period}</td>
                      <td>{inv.volume}</td>
                      <td><strong>{inv.amount}</strong></td>
                      <td>
                        <span
                          className={`comm-badge ${
                            inv.status === "Paid"
                              ? "badge-success"
                              : inv.status === "Pending"
                              ? "badge-warning"
                              : "badge-danger"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{inv.paidOn}</td>
                      <td>{inv.method}</td>
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

export default CommunityBilling;
