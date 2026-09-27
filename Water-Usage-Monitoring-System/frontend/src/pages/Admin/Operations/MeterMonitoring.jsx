import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./MeterMonitoring.css";

function MeterMonitoring() {
  const navigate = useNavigate();

  const [meters, setMeters] = useState([
    {
      id: "WM-A101-2026",
      location: "Apartment A-402 (Block A)",
      resident: "Sowmiya",
      battery: 94,
      signal: -68,
      flowRate: "4.2 L/min",
      totalVolume: "1,302.64 KL",
      lastPing: "10 sec ago",
      status: "Online",
      fw: "v3.4.2",
    },
    {
      id: "WM-A101-8821",
      location: "Apartment A-101 (Block A)",
      resident: "Rahul Sharma",
      battery: 88,
      signal: -72,
      flowRate: "3.8 L/min",
      totalVolume: "1,142.10 KL",
      lastPing: "2 min ago",
      status: "Online",
      fw: "v3.4.2",
    },
    {
      id: "WM-B203-9912",
      location: "Apartment B-203 (Block B)",
      resident: "Priya Sundaram",
      battery: 72,
      signal: -85,
      flowRate: "8.6 L/min",
      totalVolume: "1,580.40 KL",
      lastPing: "5 min ago",
      status: "Warning",
      fw: "v3.4.1",
    },
    {
      id: "WM-B304-4412",
      location: "Apartment B-304 (Block B)",
      resident: "Arun Varma",
      battery: 91,
      signal: -65,
      flowRate: "2.1 L/min",
      totalVolume: "890.20 KL",
      lastPing: "1 min ago",
      status: "Online",
      fw: "v3.4.2",
    },
    {
      id: "WM-C501-1190",
      location: "Apartment C-501 (Block C)",
      resident: "Vikram Malhotra",
      battery: 15,
      signal: -98,
      flowRate: "0.0 L/min",
      totalVolume: "0.00 KL",
      lastPing: "3 hrs ago",
      status: "Critical",
      fw: "v3.2.0",
    },
    {
      id: "WM-D402-5511",
      location: "Apartment D-402 (Block D)",
      resident: "Karan Kapoor",
      battery: 0,
      signal: -110,
      flowRate: "0.0 L/min",
      totalVolume: "940.50 KL",
      lastPing: "12 hrs ago",
      status: "Offline",
      fw: "v3.1.0",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [pingMessage, setPingMessage] = useState("");

  const filteredMeters = useMemo(() => {
    return meters.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        m.id.toLowerCase().includes(q) ||
        m.resident.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || m.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [meters, search, statusFilter]);

  const handlePingMeter = (meterId) => {
    setPingMessage(`✓ Heartbeat ping request sent to meter ${meterId}. RSSI signal response: -68 dBm (Optimal).`);
    setTimeout(() => setPingMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Meter ID",
      "Assigned Location",
      "Resident Name",
      "Battery (%)",
      "Signal RSSI (dBm)",
      "Flow Rate",
      "Total Volume",
      "Last Heartbeat",
      "Status",
      "Firmware",
    ];

    const rows = filteredMeters.map((m) => [
      m.id,
      m.location,
      m.resident,
      m.battery,
      m.signal,
      m.flowRate,
      m.totalVolume,
      m.lastPing,
      m.status,
      m.fw,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MeterMonitoring_Telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="meter-ops-page">
      <AdminSidebar activePage="Meter Monitoring" />

      <main className="meter-ops-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">OPERATIONS & INFRASTRUCTURE</span>
            <h1>Smart Water Meter Operations</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              📊 Export Telemetry CSV
            </button>
          </div>
        </header>

        <div className="meter-ops-content">
          {pingMessage && <div className="ping-alert-banner">{pingMessage}</div>}

          {/* KPI CARDS */}
          <section className="ops-kpi-grid">
            <div className="ops-kpi-card">
              <div className="kpi-icon-box total">📡</div>
              <div>
                <span>TOTAL INSTALLED METERS</span>
                <strong>142 <small>Units</small></strong>
                <small>LoRaWAN / NB-IoT Enabled</small>
              </div>
            </div>

            <div className="ops-kpi-card">
              <div className="kpi-icon-box online">✓</div>
              <div>
                <span>ONLINE ACTIVE STREAM</span>
                <strong>139 <small>Online</small></strong>
                <small>97.8% Signal Reliability</small>
              </div>
            </div>

            <div className="ops-kpi-card">
              <div className="kpi-icon-box warning">⚠</div>
              <div>
                <span>HIGH FLOW WARNINGS</span>
                <strong className="text-warning">2 <small>Units</small></strong>
                <small>Flow rate &gt; 8 L/min</small>
              </div>
            </div>

            <div className="ops-kpi-card">
              <div className="kpi-icon-box critical">!</div>
              <div>
                <span>CRITICAL / OFFLINE</span>
                <strong className="text-danger">3 <small>Meters</small></strong>
                <small>Requires Maintenance Visit</small>
              </div>
            </div>
          </section>

          {/* SEARCH & FILTERS */}
          <section className="ops-filters-card">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search meter by serial ID, apartment unit, or resident name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-selects">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Operational Statuses</option>
                <option value="Online">Online</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </section>

          {/* METERS TELEMETRY TABLE */}
          <section className="ops-table-card">
            <div className="table-header-title">
              <h3>Live Smart Meter Telemetry Grid ({filteredMeters.length})</h3>
            </div>

            <table className="ops-table">
              <thead>
                <tr>
                  <th>Meter Serial ID</th>
                  <th>Location & Unit</th>
                  <th>Resident Name</th>
                  <th>Battery</th>
                  <th>Signal RSSI</th>
                  <th>Flow Rate</th>
                  <th>Totalizer</th>
                  <th>Last Ping</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeters.length > 0 ? (
                  filteredMeters.map((m) => (
                    <tr key={m.id}>
                      <td className="font-id">{m.id}</td>
                      <td><strong>{m.location}</strong></td>
                      <td>{m.resident}</td>
                      <td>
                        <span className={`battery-badge ${m.battery < 20 ? "low" : "ok"}`}>
                          🔋 {m.battery}%
                        </span>
                      </td>
                      <td>{m.signal} dBm</td>
                      <td className="flow-val"><strong>{m.flowRate}</strong></td>
                      <td>{m.totalVolume}</td>
                      <td className="text-sub">{m.lastPing}</td>
                      <td>
                        <span className={`status-badge-ops ${m.status.toLowerCase()}`}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action"
                            onClick={() => handlePingMeter(m.id)}
                          >
                            Ping
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-view"
                            onClick={() => setSelectedMeter(m)}
                          >
                            View Telemetry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="empty-table-msg">
                      No meters found matching "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* METER TELEMETRY MODAL */}
          {selectedMeter && (
            <div className="rpt-modal-backdrop" onClick={() => setSelectedMeter(null)}>
              <div className="rpt-modal-box meter-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="rpt-modal-header">
                  <div>
                    <span className="rpt-modal-sub">METER TELEMETRY AUDIT</span>
                    <h3>Meter Serial #{selectedMeter.id}</h3>
                  </div>
                  <button type="button" className="rpt-btn-close-modal" onClick={() => setSelectedMeter(null)}>×</button>
                </div>

                <div className="rpt-modal-body">
                  <div className="m-hero-card">
                    <div>
                      <span>LOCATION</span>
                      <strong>{selectedMeter.location}</strong>
                      <p>Resident: {selectedMeter.resident}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>OPERATIONAL STATUS</span>
                      <span className={`status-badge-ops ${selectedMeter.status.toLowerCase()}`}>
                        {selectedMeter.status}
                      </span>
                    </div>
                  </div>

                  <div className="m-telemetry-grid">
                    <div className="t-box">
                      <span>Live Flow Rate</span>
                      <strong>{selectedMeter.flowRate}</strong>
                    </div>
                    <div className="t-box">
                      <span>Volume Totalizer</span>
                      <strong>{selectedMeter.totalVolume}</strong>
                    </div>
                    <div className="t-box">
                      <span>Battery Health</span>
                      <strong>{selectedMeter.battery}%</strong>
                    </div>
                    <div className="t-box">
                      <span>LoRaWAN RSSI Signal</span>
                      <strong>{selectedMeter.signal} dBm</strong>
                    </div>
                    <div className="t-box">
                      <span>Firmware Version</span>
                      <strong>{selectedMeter.fw}</strong>
                    </div>
                    <div className="t-box">
                      <span>Last Heartbeat</span>
                      <strong>{selectedMeter.lastPing}</strong>
                    </div>
                  </div>

                  <div className="rpt-modal-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary-action"
                      onClick={() => handlePingMeter(selectedMeter.id)}
                    >
                      📡 Test Signal Ping
                    </button>
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedMeter(null)}
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

export default MeterMonitoring;
