import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityAlerts() {
  const [alerts] = useState([
    { id: "ALT-501", location: "Apartment B-203", type: "Continuous Flow Leak Warning", severity: "Critical", time: "12 mins ago", engine: "Two-Sigma Leak Engine", status: "Active" },
    { id: "ALT-502", location: "Tower A Header Valve", type: "Pressure Drop Anomaly (1.8 bar)", severity: "Medium", time: "42 mins ago", engine: "Telemetry Sensor V2", status: "Investigating" },
    { id: "ALT-503", location: "Apartment C-102", type: "Abnormal Midnight Flow Spike", severity: "Warning", time: "4 hours ago", engine: "Two-Sigma Leak Engine", status: "Resolved" },
    { id: "ALT-504", location: "Community Tank C", type: "Low Water Reserve Alert (<25%)", severity: "Warning", time: "6 hours ago", engine: "Tank Level Ultrasonic", status: "Resolved" },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Alerts & Notifications" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">SAFETY &amp; ANOMALY SURVEILLANCE</span>
            <h1>Alerts &amp; Notifications</h1>
            <p>Monitor real-time pipeline leak warnings, 2-Sigma anomalies, and community alerts</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Community Broadcast SMS & Push modal opened.")}
            >
              📢 Broadcast Community Notice
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fee2e2", color: "#b91c1c" }}>🚨</div>
              <div className="comm-stat-info">
                <span>Active Alarms</span>
                <strong>1 Critical</strong>
                <p>Apartment B-203 (14.2 L/min)</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>⚡</div>
              <div className="comm-stat-info">
                <span>2-Sigma Anomalies</span>
                <strong>2 Flagged Today</strong>
                <p>Automated Sensor Verification</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>✓</div>
              <div className="comm-stat-info">
                <span>Resolved This Week</span>
                <strong>14 Alerts</strong>
                <p>Average Fix Time: 28 mins</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>📱</div>
              <div className="comm-stat-info">
                <span>Resident Notices</span>
                <strong>100% Delivered</strong>
                <p>SMS &amp; In-App Notification</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Real-Time Anomaly &amp; Hazard Stream</h2>
                <p>Continuous pipeline and apartment flow monitoring</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Alert ID</th>
                    <th>Location / Unit</th>
                    <th>Alarm Description</th>
                    <th>Severity Level</th>
                    <th>Detection Engine</th>
                    <th>Timestamp</th>
                    <th>Current Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{a.id}</td>
                      <td><strong>{a.location}</strong></td>
                      <td>{a.type}</td>
                      <td>
                        <span
                          className={`comm-badge ${
                            a.severity === "Critical"
                              ? "badge-danger"
                              : a.severity === "Warning"
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td style={{ color: "#475569" }}>{a.engine}</td>
                      <td style={{ color: "#64748b" }}>{a.time}</td>
                      <td>
                        <span
                          className={`comm-badge ${
                            a.status === "Resolved"
                              ? "badge-success"
                              : a.status === "Active"
                              ? "badge-danger"
                              : "badge-warning"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                          onClick={() => alert(`Taking action on alert ${a.id}`)}
                        >
                          Dispatch
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

export default CommunityAlerts;
