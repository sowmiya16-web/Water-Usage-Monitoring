import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./TrafficManagement.css";

function TrafficManagement() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([
    {
      sessionId: "SES-99201",
      user: "Sowmiya",
      unit: "Apartment A-402",
      role: "Resident",
      pageAccessed: "Current Bill & Payment Gateway",
      device: "Chrome v128 (macOS)",
      ip: "192.168.1.104",
      lastActive: "Just now",
      status: "Active",
    },
    {
      sessionId: "SES-99198",
      user: "Rahul Sharma",
      unit: "Apartment A-101",
      role: "Resident",
      pageAccessed: "Water Consumption Monitoring",
      device: "Safari (iOS Mobile)",
      ip: "192.168.1.112",
      lastActive: "2 mins ago",
      status: "Active",
    },
    {
      sessionId: "SES-99195",
      user: "Priya Sundaram",
      unit: "Apartment B-203",
      role: "Resident",
      pageAccessed: "Usage History Analytics",
      device: "Firefox v127 (Windows 11)",
      ip: "192.168.1.140",
      lastActive: "5 mins ago",
      status: "Active",
    },
    {
      sessionId: "SES-99190",
      user: "Arun Varma",
      unit: "Apartment B-304",
      role: "Resident",
      pageAccessed: "Meter Details & Diagnostic",
      device: "Edge v126 (Windows 10)",
      ip: "192.168.1.155",
      lastActive: "12 mins ago",
      status: "Idle",
    },
    {
      sessionId: "SES-99182",
      user: "Vikram Malhotra",
      unit: "Apartment C-501",
      role: "Resident",
      pageAccessed: "Payment History",
      device: "Chrome (Android)",
      ip: "192.168.1.189",
      lastActive: "25 mins ago",
      status: "Idle",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedSession, setSelectedSession] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.sessionId.toLowerCase().includes(q) ||
        s.user.toLowerCase().includes(q) ||
        s.unit.toLowerCase().includes(q) ||
        s.pageAccessed.toLowerCase().includes(q) ||
        s.ip.includes(q);

      const matchesStatus = statusFilter === "All" || s.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const handleTerminateSession = (sessionId, userName) => {
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    setNoticeMessage(`✓ Session #${sessionId} for ${userName} terminated successfully.`);
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Session ID",
      "User Name",
      "Apartment Unit",
      "Portal Page",
      "Device / Browser",
      "IP Address",
      "Last Active",
      "Status",
    ];

    const rows = filteredSessions.map((s) => [
      s.sessionId,
      s.user,
      s.unit,
      s.pageAccessed,
      s.device,
      s.ip,
      s.lastActive,
      s.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrafficManagement_ActiveSessions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-traffic-page">
      <AdminSidebar activePage="Traffic Management" />

      <main className="admin-traffic-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">SYSTEM OPERATIONS & TRAFFIC ANALYTICS</span>
            <h1>Traffic & Portal Activity Management</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              🌐 Export Traffic CSV
            </button>
          </div>
        </header>

        <div className="admin-traffic-content">
          {noticeMessage && <div className="notice-alert-banner">{noticeMessage}</div>}

          {/* KPI CARDS */}
          <section className="traffic-kpi-grid">
            <div className="traffic-kpi-card">
              <div className="kpi-icon-box online">📡</div>
              <div>
                <span>ACTIVE ONLINE SESSIONS</span>
                <strong>42 <small>Live Users</small></strong>
                <small>18 Concurrent Active Stream</small>
              </div>
            </div>

            <div className="traffic-kpi-card">
              <div className="kpi-icon-box dau">👥</div>
              <div>
                <span>DAILY ACTIVE USERS (DAU)</span>
                <strong>128 <small>Households</small></strong>
                <small>90.1% Society Engagement</small>
              </div>
            </div>

            <div className="traffic-kpi-card">
              <div className="kpi-icon-box peak">🔥</div>
              <div>
                <span>PEAK TRAFFIC HOURS</span>
                <strong>07:00–09:00 <small>AM</small></strong>
                <small>Secondary Peak: 07:00–09:00 PM</small>
              </div>
            </div>

            <div className="traffic-kpi-card">
              <div className="kpi-icon-box health">⚡</div>
              <div>
                <span>PORTAL SYSTEM UPTIME</span>
                <strong className="text-success">99.98%</strong>
                <small>Avg Response Latency: 42ms</small>
              </div>
            </div>
          </section>

          {/* 24-HOUR HOURLY TRAFFIC TREND GRAPH */}
          <section className="traffic-chart-section">
            <div className="chart-header">
              <div>
                <h3>24-Hour Portal Activity & Concurrent User Sessions Curve</h3>
                <small>Real-time hourly active sessions stream logged across Resident & Admin Portals</small>
              </div>
            </div>

            <div className="traffic-curve-container">
              {[
                { time: "00:00", users: 8 },
                { time: "04:00", users: 4 },
                { time: "08:00", users: 38 },
                { time: "12:00", users: 22 },
                { time: "16:00", users: 19 },
                { time: "20:00", users: 42 },
              ].map((t) => (
                <div key={t.time} className="curve-point-group">
                  <div className="point-column">
                    <div
                      className="point-bar"
                      style={{ height: `${(t.users / 50) * 110}px` }}
                      title={`${t.users} active sessions`}
                    ></div>
                    <span className="point-val">{t.users}</span>
                  </div>
                  <span className="curve-label">{t.time}</span>
                </div>
              ))}
            </div>
          </section>

          {/* PORTAL SECTION POPULARITY BREAKDOWN */}
          <section className="section-popularity-card">
            <div className="chart-header">
              <h3>Portal Page Activity Share Breakdown</h3>
              <small>Distribution of user navigation activity across application modules</small>
            </div>

            <div className="popularity-bars-container">
              <div className="p-bar-row">
                <div className="p-label"><span>User Overview & Dashboard (45%)</span><strong>57.6k Views</strong></div>
                <div className="p-progress"><div className="p-fill dash" style={{ width: "45%" }}></div></div>
              </div>

              <div className="p-bar-row">
                <div className="p-label"><span>Billing & Payment Gateway (30%)</span><strong>38.4k Views</strong></div>
                <div className="p-progress"><div className="p-fill bill" style={{ width: "30%" }}></div></div>
              </div>

              <div className="p-bar-row">
                <div className="p-label"><span>Meter Telemetry & Usage Analytics (18%)</span><strong>23.0k Views</strong></div>
                <div className="p-progress"><div className="p-fill water" style={{ width: "18%" }}></div></div>
              </div>

              <div className="p-bar-row">
                <div className="p-label"><span>Help Support & Account Settings (7%)</span><strong>9.0k Views</strong></div>
                <div className="p-progress"><div className="p-fill settings" style={{ width: "7%" }}></div></div>
              </div>
            </div>
          </section>

          {/* SEARCH & FILTERS */}
          <section className="traffic-filters-card">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search session ID, resident name, IP address, or page accessed..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-selects">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Session Statuses</option>
                <option value="Active">Active</option>
                <option value="Idle">Idle</option>
              </select>
            </div>
          </section>

          {/* SESSIONS TABLE */}
          <section className="traffic-table-card">
            <div className="table-header-title">
              <h3>Active Portal Sessions Audit Trail ({filteredSessions.length})</h3>
            </div>

            <table className="traffic-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Resident & Unit</th>
                  <th>Page Accessed</th>
                  <th>Device / Browser</th>
                  <th>IP Address</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((s) => (
                    <tr key={s.sessionId}>
                      <td className="font-id">{s.sessionId}</td>
                      <td>
                        <strong>{s.user}</strong>
                        <p className="text-sub" style={{ margin: "2px 0 0" }}>{s.unit}</p>
                      </td>
                      <td><span className="charge-cat usage">{s.pageAccessed}</span></td>
                      <td className="text-sub">{s.device}</td>
                      <td className="font-id">{s.ip}</td>
                      <td className="text-sub">{s.lastActive}</td>
                      <td>
                        <span className={`badge-status ${s.status.toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-view"
                            onClick={() => setSelectedSession(s)}
                          >
                            Audit
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action btn-danger-act"
                            onClick={() => handleTerminateSession(s.sessionId, s.user)}
                          >
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-table-msg">
                      No active sessions found matching "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* SESSION DETAIL MODAL */}
          {selectedSession && (
            <div className="rpt-modal-backdrop" onClick={() => setSelectedSession(null)}>
              <div className="rpt-modal-box session-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="rpt-modal-header">
                  <div>
                    <span className="rpt-modal-sub">SESSION DIAGNOSTICS AUDIT</span>
                    <h3>Session #{selectedSession.sessionId}</h3>
                  </div>
                  <button type="button" className="rpt-btn-close-modal" onClick={() => setSelectedSession(null)}>×</button>
                </div>

                <div className="rpt-modal-body">
                  <div className="s-hero-card">
                    <div>
                      <span>ACTIVE RESIDENT USER</span>
                      <strong>{selectedSession.user}</strong>
                      <p>{selectedSession.unit} • Role: {selectedSession.role}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>SESSION STATUS</span>
                      <span className={`badge-status ${selectedSession.status.toLowerCase()}`}>
                        {selectedSession.status}
                      </span>
                    </div>
                  </div>

                  <div className="s-grid">
                    <div className="s-box">
                      <span>Portal Section</span>
                      <strong>{selectedSession.pageAccessed}</strong>
                    </div>
                    <div className="s-box">
                      <span>Client IP Address</span>
                      <strong>{selectedSession.ip}</strong>
                    </div>
                    <div className="s-box">
                      <span>Device / Browser</span>
                      <strong>{selectedSession.device}</strong>
                    </div>
                    <div className="s-box">
                      <span>Last Activity Heartbeat</span>
                      <strong>{selectedSession.lastActive}</strong>
                    </div>
                  </div>

                  <div className="rpt-modal-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary-action btn-danger-act"
                      onClick={() => {
                        handleTerminateSession(selectedSession.sessionId, selectedSession.user);
                        setSelectedSession(null);
                      }}
                    >
                      ⛔ Terminate Session
                    </button>
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedSession(null)}
                    >
                      Close Diagnostics
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

export default TrafficManagement;
