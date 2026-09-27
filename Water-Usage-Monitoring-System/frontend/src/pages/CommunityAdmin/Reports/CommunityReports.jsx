import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityReports() {
  const [reports] = useState([
    { id: "REP-2026-M08", title: "August 2026 Comprehensive Water Audit", type: "Consumption & Mass Balance", size: "3.4 MB PDF", generated: "31 Aug 2026", author: "Automated Audit Engine" },
    { id: "REP-2026-M07", title: "July 2026 Financial & Revenue Ledger", type: "Financial Billing", size: "2.1 MB PDF", generated: "31 Jul 2026", author: "Finance Department" },
    { id: "REP-2026-Q02", title: "Q2 2026 Infrastructure Health & Valve Report", type: "Technical Operations", size: "4.8 MB PDF", generated: "01 Jul 2026", author: "Maintenance Supervisor" },
    { id: "REP-2026-L01", title: "Statistical 2-Sigma Leak Prevention Analysis", type: "AI Analytics", size: "1.9 MB PDF", generated: "15 Jun 2026", author: "Smart Analytics Unit" },
  ]);

  const handleDownload = (title) => {
    alert(`Downloading report: ${title}`);
  };

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Reports" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">AUDIT &amp; COMPLIANCE</span>
            <h1>Reports</h1>
            <p>Export community-wide water balances, revenue settlement audits, and environmental metrics</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Generate Custom Date-Range Report")}
            >
              📊 Generate Custom Report
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>📑</div>
              <div className="comm-stat-info">
                <span>Available Reports</span>
                <strong>24 Reports</strong>
                <p>Audited &amp; Digitally Signed</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>⚖️</div>
              <div className="comm-stat-info">
                <span>Mass Balance</span>
                <strong>99.1% Accounted</strong>
                <p>Zero Unexplained Losses</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>🏢</div>
              <div className="comm-stat-info">
                <span>AGM Regulatory</span>
                <strong>Compliant</strong>
                <p>Meets Municipal Water Standards</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>📥</div>
              <div className="comm-stat-info">
                <span>Export Formats</span>
                <strong>PDF, Excel, CSV</strong>
                <p>Tamper-Proof Timestamps</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Published Community Audit Reports</h2>
                <p>Monthly and quarterly official publications available for download</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Report Document Title</th>
                    <th>Audit Category</th>
                    <th>File Format</th>
                    <th>Date Published</th>
                    <th>Authoring Module</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{r.id}</td>
                      <td><strong>{r.title}</strong></td>
                      <td>
                        <span className="comm-badge badge-info">{r.type}</span>
                      </td>
                      <td style={{ color: "#64748b" }}>{r.size}</td>
                      <td>{r.generated}</td>
                      <td>{r.author}</td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 12px", fontSize: "12px" }}
                          onClick={() => handleDownload(r.title)}
                        >
                          ⬇ Download
                        </button>
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

export default CommunityReports;
