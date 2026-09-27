import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import "./UsageHistory.css";

function UsageHistory() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showTrendChart, setShowTrendChart] = useState(true);

  const records = [
    {
      date: "28 Aug 2026",
      day: "Friday",
      startReading: "1,301.98 KL",
      reading: "1,302.64 KL",
      usage: 0.66,
      flow: "4.2 L/min",
      peakHour: "08:30 AM",
      status: "Normal",
      hourlyBreakdown: [
        { time: "06:00 AM", usage: 120 },
        { time: "08:30 AM", usage: 240 },
        { time: "01:00 PM", usage: 90 },
        { time: "07:30 PM", usage: 210 },
      ],
    },
    {
      date: "27 Aug 2026",
      day: "Thursday",
      startReading: "1,301.35 KL",
      reading: "1,301.98 KL",
      usage: 0.63,
      flow: "3.9 L/min",
      peakHour: "07:45 AM",
      status: "Normal",
      hourlyBreakdown: [
        { time: "06:00 AM", usage: 110 },
        { time: "07:45 AM", usage: 230 },
        { time: "01:00 PM", usage: 100 },
        { time: "08:00 PM", usage: 190 },
      ],
    },
    {
      date: "26 Aug 2026",
      day: "Wednesday",
      startReading: "1,300.81 KL",
      reading: "1,301.35 KL",
      usage: 0.54,
      flow: "3.5 L/min",
      peakHour: "09:00 AM",
      status: "Saver",
      hourlyBreakdown: [
        { time: "06:00 AM", usage: 90 },
        { time: "09:00 AM", usage: 180 },
        { time: "02:00 PM", usage: 80 },
        { time: "08:30 PM", usage: 190 },
      ],
    },
    {
      date: "25 Aug 2026",
      day: "Tuesday",
      startReading: "1,300.20 KL",
      reading: "1,300.81 KL",
      usage: 0.61,
      flow: "4.0 L/min",
      peakHour: "08:15 AM",
      status: "Normal",
      hourlyBreakdown: [
        { time: "06:00 AM", usage: 130 },
        { time: "08:15 AM", usage: 220 },
        { time: "01:30 PM", usage: 85 },
        { time: "07:45 PM", usage: 175 },
      ],
    },
    {
      date: "24 Aug 2026",
      day: "Monday",
      startReading: "1,299.48 KL",
      reading: "1,300.20 KL",
      usage: 0.72,
      flow: "4.7 L/min",
      peakHour: "10:00 AM",
      status: "High",
      hourlyBreakdown: [
        { time: "06:00 AM", usage: 140 },
        { time: "10:00 AM", usage: 310 },
        { time: "02:00 PM", usage: 110 },
        { time: "08:00 PM", usage: 160 },
      ],
    },
    {
      date: "23 Aug 2026",
      day: "Sunday",
      startReading: "1,298.80 KL",
      reading: "1,299.48 KL",
      usage: 0.68,
      flow: "4.4 L/min",
      peakHour: "11:15 AM",
      status: "Normal",
      hourlyBreakdown: [
        { time: "08:00 AM", usage: 150 },
        { time: "11:15 AM", usage: 260 },
        { time: "03:30 PM", usage: 120 },
        { time: "09:00 PM", usage: 150 },
      ],
    },
    {
      date: "22 Aug 2026",
      day: "Saturday",
      startReading: "1,298.21 KL",
      reading: "1,298.80 KL",
      usage: 0.59,
      flow: "3.8 L/min",
      peakHour: "09:30 AM",
      status: "Saver",
      hourlyBreakdown: [
        { time: "07:00 AM", usage: 100 },
        { time: "09:30 AM", usage: 210 },
        { time: "01:00 PM", usage: 100 },
        { time: "08:00 PM", usage: 180 },
      ],
    },
  ];

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.date.toLowerCase().includes(search.toLowerCase()) ||
        r.day.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || r.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalUsage = useMemo(() => records.reduce((acc, r) => acc + r.usage, 0), [records]);
  const avgUsage = totalUsage / records.length;
  const maxUsage = Math.max(...records.map((r) => r.usage));
  const minUsage = Math.min(...records.map((r) => r.usage));

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Day",
      "Start Reading",
      "End Reading",
      "Usage (KL)",
      "Flow Rate",
      "Peak Hour",
      "Status",
    ];

    const rows = filteredRecords.map((r) => [
      r.date,
      r.day,
      r.startReading,
      r.reading,
      r.usage.toFixed(2),
      r.flow,
      r.peakHour,
      r.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WaterUsageHistory_${profile.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="history-page">
      <Sidebar
        activePage="Usage History"
        onNavigate={handleNavigation}
        onLogout={() => navigate("/login")}
      />

      <main className="history-main">
        <Header activePage="Usage History" />

        <div className="history-content">
          {/* HEADING */}
          <div className="history-heading">
            <div>
              <span className="history-subhead">WATER MANAGEMENT</span>
              <h2>Usage History & Meter Logs</h2>
              <p>Daily water consumption logs and flow telemetry for {profile.name} ({profile.apartment}).</p>
            </div>

            <div className="heading-actions">
              <button type="button" className="btn-secondary" onClick={handleExportCSV}>
                ↓ Export Report CSV
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <section className="history-kpi-grid">
            <div className="history-kpi-card">
              <div className="kpi-icon-box total">💧</div>
              <div>
                <span>7-DAY TOTAL USAGE</span>
                <strong>{totalUsage.toFixed(2)} <small>KL</small></strong>
                <small>4,430 Litres total</small>
              </div>
            </div>

            <div className="history-kpi-card">
              <div className="kpi-icon-box avg">◷</div>
              <div>
                <span>DAILY AVERAGE</span>
                <strong>{avgUsage.toFixed(2)} <small>KL</small></strong>
                <small>633 Litres / day</small>
              </div>
            </div>

            <div className="history-kpi-card">
              <div className="kpi-icon-box max">📈</div>
              <div>
                <span>HIGHEST USAGE DAY</span>
                <strong>{maxUsage.toFixed(2)} <small>KL</small></strong>
                <small>Monday, 24 Aug</small>
              </div>
            </div>

            <div className="history-kpi-card">
              <div className="kpi-icon-box min">🌱</div>
              <div>
                <span>LOWEST USAGE DAY</span>
                <strong>{minUsage.toFixed(2)} <small>KL</small></strong>
                <small>Wednesday, 26 Aug</small>
              </div>
            </div>
          </section>

          {/* TREND CHART */}
          <section className="history-chart-card">
            <div className="card-header-flex">
              <div>
                <h3>7-Day Consumption Trend</h3>
                <p>Daily volume telemetry curve (Kilolitres)</p>
              </div>
              <button
                type="button"
                className="btn-toggle-graph"
                onClick={() => setShowTrendChart(!showTrendChart)}
              >
                {showTrendChart ? "Hide Trend Chart ↑" : "Show Trend Chart ↓"}
              </button>
            </div>

            {showTrendChart && (
              <div className="trend-bars-container">
                {records.slice().reverse().map((r) => (
                  <div key={r.date} className="trend-bar-col">
                    <span className="bar-amt">{r.usage.toFixed(2)} KL</span>
                    <div className="trend-bar-bg">
                      <div
                        className={`trend-bar-fill ${r.status.toLowerCase()}`}
                        style={{ height: `${(r.usage / 0.9) * 100}%` }}
                      ></div>
                    </div>
                    <span className="bar-month">{r.day.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEARCH & FILTERS */}
          <section className="history-filters">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search by date or day..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-selects">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Usage Types</option>
                <option value="Normal">Normal Usage</option>
                <option value="High">High Usage</option>
                <option value="Saver">Saver Day</option>
              </select>
            </div>
          </section>

          {/* LOGS TABLE */}
          <section className="history-table-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Day</th>
                  <th>Meter Reading Range</th>
                  <th>Daily Usage</th>
                  <th>Flow Rate</th>
                  <th>Peak Hour</th>
                  <th>Status Badge</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r) => (
                    <tr key={r.date}>
                      <td className="log-date">
                        <strong>{r.date}</strong> <small>{r.day}</small>
                      </td>
                      <td className="log-readings">
                        <small>{r.startReading} → {r.reading}</small>
                      </td>
                      <td className="log-usage">
                        <strong>{r.usage.toFixed(2)} KL</strong>
                      </td>
                      <td className="log-flow">{r.flow}</td>
                      <td className="log-peak">{r.peakHour}</td>
                      <td>
                        <span className={`status-tag ${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-tbl-action"
                          onClick={() => setSelectedRecord(r)}
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">
                      No matching records found for "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* DAILY BREAKDOWN MODAL */}
          {selectedRecord && (
            <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
              <div className="modal-box record-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span className="modal-sub">HOURLY WATER TELEMETRY</span>
                    <h3>{selectedRecord.day}, {selectedRecord.date}</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setSelectedRecord(null)}>×</button>
                </div>

                <div className="modal-body">
                  <div className="record-summary-banner">
                    <div>
                      <span>DAILY TOTAL CONSUMPTION</span>
                      <strong className="r-amt-val">{selectedRecord.usage.toFixed(2)} KL</strong>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>PEAK FLOW HOUR</span>
                      <strong>{selectedRecord.peakHour}</strong>
                      <small>Max Rate: {selectedRecord.flow}</small>
                    </div>
                  </div>

                  <div className="modal-hourly-box">
                    <h4>Hourly Flow Distribution (Litres)</h4>
                    <div className="hourly-bars-row">
                      {selectedRecord.hourlyBreakdown.map((h) => (
                        <div key={h.time} className="hourly-col">
                          <span className="h-val">{h.usage}L</span>
                          <div className="h-bar-bg">
                            <div className="h-bar-fill" style={{ height: `${(h.usage / 350) * 100}%` }}></div>
                          </div>
                          <small className="h-time">{h.time}</small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedRecord(null)}
                    >
                      Close Breakdown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default UsageHistory;