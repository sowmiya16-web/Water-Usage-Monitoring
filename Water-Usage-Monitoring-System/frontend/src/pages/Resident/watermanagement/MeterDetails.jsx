import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import "./MeterDetails.css";

function MeterDetails() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [reading, setReading] = useState(1302.64);
  const [flowRate, setFlowRate] = useState(4.2);
  const [pressure, setPressure] = useState(2.4);
  const [updated, setUpdated] = useState(new Date());
  const [showDiagnosticChart, setShowDiagnosticChart] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setReading((prev) => Number((prev + Math.random() * 0.002).toFixed(3)));
      setFlowRate((prev) => Number((4.0 + Math.random() * 0.5).toFixed(1)));
      setPressure((prev) => Number((2.35 + Math.random() * 0.1).toFixed(2)));
      setUpdated(new Date());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (page) => {
    const routes = {
      Overview: "/resident/dashboard",
      "Water Consumption": "/resident/water-consumption",
      "Usage History": "/resident/usage-history",
      "Meter Details": "/resident/meter-details",
      "Current Bill": "/resident/current-bill",
      "Billing History": "/resident/billing-history",
      "Payment History": "/resident/payment-history",
      Notifications: "/resident/notifications",
      Alerts: "/resident/alerts",
      "My Profile": "/resident/profile",
      "Account Settings": "/resident/settings",
      "Help & Support": "/resident/help",
    };

    if (routes[page]) navigate(routes[page]);
  };

  const hourlyReadings = [
    { hour: "00:00", flow: 0.2 },
    { hour: "03:00", flow: 0.0 },
    { hour: "06:00", flow: 3.5 },
    { hour: "09:00", flow: 5.2 },
    { hour: "12:00", flow: 2.1 },
    { hour: "15:00", flow: 1.8 },
    { hour: "18:00", flow: 4.8 },
    { hour: "21:00", flow: flowRate },
  ];

  const recentEvents = [
    { time: "Just now", event: "Live Heartbeat Sync", type: "system", status: "Success" },
    { time: "Today 08:00 AM", event: "Automated Reading Broadcast", type: "telemetry", status: "Transmitted" },
    { time: "Yesterday 11:30 PM", event: "Zero-Leak Verification Check", type: "security", status: "Passed (0 Leak)" },
    { time: "15 Feb 2026", event: "Annual Calibration & Sensor Audit", type: "maintenance", status: "Verified" },
  ];

  return (
    <div className="meter-page">
      <Sidebar
        activePage="Meter Details"
        onNavigate={handleNavigation}
        onLogout={() => navigate("/login")}
      />

      <main className="meter-main">
        {/* TOP NAVIGATION HEADER (MATCHING OTHER RESIDENT PAGES) */}
        <Header activePage="Meter Details" />

        <div className="meter-content">
          {/* PAGE HEADING (LEFT-TO-RIGHT DASHBOARD LAYOUT MATCHING OTHER PAGES) */}
          <div className="meter-page-heading">
            <div>
              <span className="meter-subhead">WATER MANAGEMENT</span>
              <h2>Meter Details & Technical Diagnostics</h2>
              <p>Real-time telemetry, sensor health monitoring, and connection specs for {profile.name} ({profile.apartment}).</p>
            </div>

            <div className="header-action-group">
              <div className="meter-live-indicator">
                <span className="live-pulse"></span>
                <div>
                  <strong>LIVE TELEMETRY STREAM</strong>
                  <small>Last ping: {updated.toLocaleTimeString()}</small>
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY GAUGES GRID */}
          <section className="telemetry-grid">
            <div className="telemetry-card main-reading-card">
              <div className="telemetry-icon">💧</div>
              <div>
                <span className="telemetry-label">TOTAL VOLUME CONSUMED</span>
                <strong className="telemetry-value">{reading.toFixed(3)} <small>KL</small></strong>
                <p className="telemetry-sub">Accumulated meter totalizer reading</p>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">⚡</div>
              <div>
                <span className="telemetry-label">CURRENT FLOW RATE</span>
                <strong className="telemetry-value">{flowRate.toFixed(1)} <small>L/min</small></strong>
                <p className="telemetry-sub">Optimal flow dynamic</p>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">⏲</div>
              <div>
                <span className="telemetry-label">LINE PRESSURE</span>
                <strong className="telemetry-value">{pressure.toFixed(2)} <small>Bar</small></strong>
                <p className="telemetry-sub">Within normal 2.0-3.0 range</p>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">📡</div>
              <div>
                <span className="telemetry-label">SIGNAL (RSSI)</span>
                <strong className="telemetry-value">-68 <small>dBm</small></strong>
                <p className="telemetry-sub">LoRaWAN Excellent Link</p>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">🔋</div>
              <div>
                <span className="telemetry-label">BATTERY HEALTH</span>
                <strong className="telemetry-value">94%</strong>
                <p className="telemetry-sub">Li-SoCl2 3.6V Battery</p>
              </div>
            </div>
          </section>

          {/* 2-COLUMN MAIN DETAILS */}
          <section className="meter-details-layout">
            {/* SPECIFICATIONS CARD */}
            <div className="meter-card-block">
              <div className="block-header">
                <h3>Device Specifications</h3>
                <span className="spec-badge">WM-A101-2026</span>
              </div>

              <div className="specs-grid">
                <div className="spec-item">
                  <span>Meter Hardware Serial</span>
                  <strong>WM-A101-2026-X8</strong>
                </div>

                <div className="spec-item">
                  <span>Meter Type / Model</span>
                  <strong>Smart Digital Ultrasonic</strong>
                </div>

                <div className="spec-item">
                  <span>Operating Status</span>
                  <strong className="text-success">● Active & Transmitting</strong>
                </div>

                <div className="spec-item">
                  <span>Firmware Version</span>
                  <strong>v2.4.1 (Latest)</strong>
                </div>

                <div className="spec-item">
                  <span>Installation Date</span>
                  <strong>15 January 2024</strong>
                </div>

                <div className="spec-item">
                  <span>Assigned Property Unit</span>
                  <strong>{profile.apartment || "Apartment A-402"} ({profile.building || "Block A"})</strong>
                </div>

                <div className="spec-item">
                  <span>Communication Protocol</span>
                  <strong>LoRaWAN 868 MHz Class A</strong>
                </div>

                <div className="spec-item">
                  <span>Calibration Status</span>
                  <strong className="text-success">✓ ISO 4064 Certified</strong>
                </div>
              </div>
            </div>

            {/* DIAGNOSTICS & FLOW CHART */}
            <div className="meter-card-block">
              <div className="block-header">
                <h3>Diagnostic Flow Profile</h3>
                <button
                  type="button"
                  className="chart-toggle-btn"
                  onClick={() => setShowDiagnosticChart(!showDiagnosticChart)}
                >
                  {showDiagnosticChart ? "Hide Chart" : "Show Chart"}
                </button>
              </div>

              {showDiagnosticChart && (
                <div className="flow-chart-container">
                  <div className="flow-bars">
                    {hourlyReadings.map((item) => (
                      <div key={item.hour} className="flow-bar-col">
                        <span className="flow-val">{item.flow.toFixed(1)}</span>
                        <div className="flow-bar-wrapper">
                          <div
                            className="flow-bar-fill"
                            style={{ height: `${(item.flow / 6) * 100}%` }}
                          ></div>
                        </div>
                        <span className="flow-time">{item.hour}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="health-checks">
                <div className="health-check-item">
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Backflow Prevention Check</strong>
                    <p>No reverse flow detected in internal check valve.</p>
                  </div>
                  <span className="badge-pass">PASS</span>
                </div>

                <div className="health-check-item">
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Continuous Leak Detection</strong>
                    <p>0 L/hr continuous flow over 24-hour monitoring window.</p>
                  </div>
                  <span className="badge-pass">NORMAL</span>
                </div>
              </div>
            </div>
          </section>

          {/* EVENTS LOG TABLE */}
          <section className="events-log-card">
            <div className="block-header">
              <div>
                <h3>System Audit & Telemetry Events Log</h3>
                <span className="log-count">Showing last 4 system diagnostic broadcasts</span>
              </div>
            </div>

            <table className="events-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Diagnostic Event Description</th>
                  <th>Telemetry Category</th>
                  <th>Result Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((evt, idx) => (
                  <tr key={idx}>
                    <td className="log-time">{evt.time}</td>
                    <td className="log-desc">{evt.event}</td>
                    <td>
                      <span className={`log-cat ${evt.type}`}>{evt.type}</span>
                    </td>
                    <td>
                      <span className="status-dot"></span>
                      <strong>{evt.status}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* QUICK ACTIONS BAR */}
          <div className="meter-actions-bar">
            <button
              type="button"
              className="action-nav-btn"
              onClick={() => navigate("/resident/water-consumption")}
            >
              ← Back to Water Consumption
            </button>
            <button
              type="button"
              className="action-nav-btn primary"
              onClick={() => navigate("/resident/usage-history")}
            >
              View Full Usage History →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MeterDetails;