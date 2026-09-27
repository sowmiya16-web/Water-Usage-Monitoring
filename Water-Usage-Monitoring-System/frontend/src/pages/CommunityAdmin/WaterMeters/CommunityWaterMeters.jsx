import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityWaterMeters() {
  const [meters] = useState([
    { id: "MTR-A402", unit: "Apartment A-402", model: "Ultrasonic Flow V3", battery: "98%", signal: "Strong (-65dBm)", flowRate: "2.4 L/min", status: "Normal", lastSync: "2s ago" },
    { id: "MTR-B104", unit: "Apartment B-104", model: "Ultrasonic Flow V3", battery: "94%", signal: "Excellent (-58dBm)", flowRate: "0.0 L/min", status: "Idle", lastSync: "5s ago" },
    { id: "MTR-B203", unit: "Apartment B-203", model: "Smart Pulse IoT", battery: "81%", signal: "Moderate (-78dBm)", flowRate: "14.2 L/min", status: "High Flow Alert", lastSync: "1s ago" },
    { id: "MTR-C305", unit: "Apartment C-305", model: "Ultrasonic Flow V3", battery: "96%", signal: "Strong (-62dBm)", flowRate: "1.8 L/min", status: "Normal", lastSync: "3s ago" },
    { id: "MTR-A102", unit: "Apartment A-102", model: "Ultrasonic Flow V2", battery: "72%", signal: "Moderate (-76dBm)", flowRate: "0.0 L/min", status: "Idle", lastSync: "8s ago" },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Water Meters" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">HARDWARE &amp; TELEMETRY</span>
            <h1>Water Meters</h1>
            <p>Supervise IoT ultrasonic meter status, flow sensors, and battery health</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Provision New Meter modal opened.")}
            >
              + Provision Smart Meter
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>📡</div>
              <div className="comm-stat-info">
                <span>Total Installed Meters</span>
                <strong>142 Units</strong>
                <p>100% LoRaWAN Coverage</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>📶</div>
              <div className="comm-stat-info">
                <span>Online &amp; Streaming</span>
                <strong>139 Online</strong>
                <p>97.9% Ping Success</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>🔋</div>
              <div className="comm-stat-info">
                <span>Average Battery</span>
                <strong>91.4%</strong>
                <p>Lithium Cell 5-Year Life</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fee2e2", color: "#b91c1c" }}>⚠️</div>
              <div className="comm-stat-info">
                <span>Telemetry Alerts</span>
                <strong>1 Node</strong>
                <p>High continuous flow alert</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Smart IoT Meter Fleet Status</h2>
                <p>Live telemetry and flow rate sensor monitoring across the property</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Meter ID</th>
                    <th>Installed Unit</th>
                    <th>Sensor Model</th>
                    <th>Battery</th>
                    <th>Signal Strength</th>
                    <th>Current Flow</th>
                    <th>Operating State</th>
                    <th>Last Sync</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{m.id}</td>
                      <td><strong>{m.unit}</strong></td>
                      <td>{m.model}</td>
                      <td>{m.battery}</td>
                      <td>{m.signal}</td>
                      <td><strong>{m.flowRate}</strong></td>
                      <td>
                        <span
                          className={`comm-badge ${
                            m.status === "Normal"
                              ? "badge-success"
                              : m.status === "Idle"
                              ? "badge-info"
                              : "badge-danger"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{m.lastSync}</td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                          onClick={() => alert(`Diagnostics running for ${m.id}`)}
                        >
                          Diagnostics
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

export default CommunityWaterMeters;
