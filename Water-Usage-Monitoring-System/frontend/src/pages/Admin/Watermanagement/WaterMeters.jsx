import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import meterService from "../../../services/meterService";

import "./WaterMeters.css";

function WaterMeters() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  const [selectedMeter, setSelectedMeter] = useState(null); // For View Diagnostics Modal
  const [editingMeter, setEditingMeter] = useState(null);   // For Live Edit Modal

  /* =========================================================
     INITIAL / DEFAULT METERS WITH RICH SPECIFICATIONS
  ========================================================= */

  const initialDefaultMeters = [
    {
      id: "WM-A101",
      serialNumber: "SN-982101",
      resident: "Rahul Sharma",
      apartment: "A-101",
      building: "Building A",
      floor: "1st Floor",
      meterType: "Smart Digital",
      currentReading: "18.6",
      previousReading: "14.4",
      consumption: "4.2",
      flowRate: "4.2 L/min",
      lastReading: "28 Aug 2026, 03:42 PM",
      installationDate: "15 Jan 2025",
      batteryPercentage: 94,
      signalStrength: -68,
      status: "Active",
      condition: "Normal",
    },
    {
      id: "WM-A102",
      serialNumber: "SN-982102",
      resident: "Arun Kumar",
      apartment: "A-102",
      building: "Building A",
      floor: "1st Floor",
      meterType: "Ultrasonic",
      currentReading: "21.3",
      previousReading: "15.1",
      consumption: "6.2",
      flowRate: "7.8 L/min",
      lastReading: "28 Aug 2026, 03:40 PM",
      installationDate: "20 Feb 2025",
      batteryPercentage: 88,
      signalStrength: -72,
      status: "Active",
      condition: "High Usage",
    },
    {
      id: "WM-A103",
      serialNumber: "SN-982103",
      resident: "Priya Sharma",
      apartment: "A-103",
      building: "Building A",
      floor: "1st Floor",
      meterType: "IoT Telemetry",
      currentReading: "16.8",
      previousReading: "16.8",
      consumption: "0.0",
      flowRate: "0.0 L/min",
      lastReading: "28 Aug 2026, 02:15 PM",
      installationDate: "10 Mar 2025",
      batteryPercentage: 15,
      signalStrength: -98,
      status: "Offline",
      condition: "Offline",
    },
    {
      id: "WM-A104",
      serialNumber: "SN-982104",
      resident: "Sowmiya",
      apartment: "A-104",
      building: "Building A",
      floor: "1st Floor",
      meterType: "Smart Digital",
      currentReading: "24.1",
      previousReading: "20.5",
      consumption: "3.6",
      flowRate: "3.1 L/min",
      lastReading: "28 Aug 2026, 03:39 PM",
      installationDate: "12 Apr 2025",
      batteryPercentage: 98,
      signalStrength: -62,
      status: "Active",
      condition: "Normal",
    },
    {
      id: "WM-B201",
      serialNumber: "SN-982201",
      resident: "Meena Ravi",
      apartment: "B-201",
      building: "Building B",
      floor: "2nd Floor",
      meterType: "IoT Telemetry",
      currentReading: "31.4",
      previousReading: "22.8",
      consumption: "8.6",
      flowRate: "12.4 L/min",
      lastReading: "28 Aug 2026, 03:37 PM",
      installationDate: "05 May 2025",
      batteryPercentage: 72,
      signalStrength: -85,
      status: "Active",
      condition: "Possible Leak",
    },
    {
      id: "WM-B202",
      serialNumber: "SN-982202",
      resident: "Vijay Kumar",
      apartment: "B-202",
      building: "Building B",
      floor: "2nd Floor",
      meterType: "Ultrasonic",
      currentReading: "19.2",
      previousReading: "16.1",
      consumption: "3.1",
      flowRate: "2.9 L/min",
      lastReading: "28 Aug 2026, 03:35 PM",
      installationDate: "18 Jun 2025",
      batteryPercentage: 91,
      signalStrength: -65,
      status: "Active",
      condition: "Normal",
    },
    {
      id: "WM-C301",
      serialNumber: "SN-982301",
      resident: "Sneha Patel",
      apartment: "C-301",
      building: "Building C",
      floor: "3rd Floor",
      meterType: "Mechanical",
      currentReading: "27.6",
      previousReading: "25.0",
      consumption: "2.6",
      flowRate: "5.4 L/min",
      lastReading: "28 Aug 2026, 03:31 PM",
      installationDate: "01 Jul 2025",
      batteryPercentage: 45,
      signalStrength: -78,
      status: "Maintenance",
      condition: "Maintenance",
    },
    {
      id: "WM-C302",
      serialNumber: "SN-982302",
      resident: "Karthik S",
      apartment: "C-302",
      building: "Building C",
      floor: "3rd Floor",
      meterType: "Smart Digital",
      currentReading: "15.8",
      previousReading: "13.2",
      consumption: "2.6",
      flowRate: "2.1 L/min",
      lastReading: "28 Aug 2026, 03:28 PM",
      installationDate: "14 Aug 2025",
      batteryPercentage: 96,
      signalStrength: -64,
      status: "Active",
      condition: "Normal",
    },
  ];

  /* =========================================================
     STATE INITIALIZATION (LOCALSTORAGE + API SYNCHRONIZATION)
  ========================================================= */

  const [meters, setMeters] = useState(() => {
    let storedList = [];
    const stored = localStorage.getItem("system_water_meters");
    if (stored) {
      try {
        storedList = JSON.parse(stored);
      } catch (err) {
        console.error("Error loading stored water meters", err);
      }
    }
    const combined = [...storedList, ...initialDefaultMeters];
    const unique = [];
    const seen = new Set();
    for (const m of combined) {
      if (m && m.id && !seen.has(m.id)) {
        seen.add(m.id);
        unique.push(m);
      }
    }
    return unique;
  });

  useEffect(() => {
    meterService.getAllMeters().then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setMeters((prev) => {
          const apiMapped = res.data.map((m) => ({
            id: m.serialNumber || `WM-${m.meterId}`,
            serialNumber: m.serialNumber || `SN-${m.meterId}`,
            resident: m.resident || "Assigned Resident",
            apartment: m.apartmentNumber || `Unit ${m.apartmentId}`,
            building: m.buildingName || "Building A",
            floor: m.floor || "1st Floor",
            meterType: m.meterType || "Smart Digital",
            currentReading: m.reading || "15.0",
            previousReading: m.previousReading || "12.0",
            consumption: m.consumption || "3.0",
            flowRate: m.flowRate ? `${m.flowRate} L/min` : "3.5 L/min",
            lastReading: m.lastPingAt ? new Date(m.lastPingAt).toLocaleString() : "Just now",
            installationDate: m.installationDate || "01 Jan 2026",
            batteryPercentage: m.batteryPercentage || 95,
            signalStrength: m.signalStrength || -68,
            status: m.status === "ONLINE" ? "Active" : m.status || "Active",
            condition: m.condition || "Normal",
          }));

          const combined = [...prev, ...apiMapped];
          const unique = [];
          const seen = new Set();
          for (const item of combined) {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              unique.push(item);
            }
          }
          return unique;
        });
      }
    }).catch((err) => {
      console.warn("Backend meters API offline, serving local storage.", err);
    });
  }, []);

  /* =========================================================
     KPI COMPUTATIONS
  ========================================================= */

  const kpis = useMemo(() => {
    const total = meters.length;
    const active = meters.filter((m) => m.status === "Active").length;
    const offline = meters.filter((m) => m.status === "Offline").length;
    const alerts = meters.filter((m) => m.condition === "Possible Leak" || m.condition === "High Usage").length;
    const activePct = total > 0 ? ((active / total) * 100).toFixed(1) : "100.0";
    return { total, active, offline, alerts, activePct };
  }, [meters]);

  /* =========================================================
     SEARCH & FILTER
  ========================================================= */

  const filteredMeters = useMemo(() => {
    return meters.filter((meter) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (meter.id && meter.id.toLowerCase().includes(q)) ||
        (meter.serialNumber && meter.serialNumber.toLowerCase().includes(q)) ||
        (meter.resident && meter.resident.toLowerCase().includes(q)) ||
        (meter.apartment && meter.apartment.toLowerCase().includes(q)) ||
        (meter.building && meter.building.toLowerCase().includes(q)) ||
        (meter.meterType && meter.meterType.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "All" ||
        meter.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, meters]);

  /* =========================================================
     LIVE EDIT HANDLER
  ========================================================= */

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingMeter) return;

    setMeters((prev) => {
      const updated = prev.map((m) => (m.id === editingMeter.id ? editingMeter : m));
      localStorage.setItem("system_water_meters", JSON.stringify(updated));
      return updated;
    });

    setEditingMeter(null);
  };

  /* =========================================================
     NAVIGATION ROUTER
  ========================================================= */

  const handleNavigation = (page) => {
    const routes = {
      Overview: "/admin/dashboard",
      Residents: "/admin/residents",
      "User Accounts": "/admin/user-accounts",
      "Water Meters": "/admin/water-meters",
      "Add Water Meter": "/admin/add-water-meter",
      "Billing Management": "/admin/billing-management",
      "Payment Management": "/admin/payment-management",
      "Tariff Management": "/admin/tariff-management",
      "Meter Monitoring": "/admin/meter-monitoring",
      "Alerts & Notifications": "/admin/alerts-notifications",
      "Consumption Reports": "/admin/consumption-reports",
      "Billing Reports": "/admin/billing-reports",
      "Revenue Reports": "/admin/revenue-reports",
      "Admin Profile": "/admin/profile",
      "System Settings": "/admin/settings",
    };

    if (routes[page]) {
      navigate(routes[page]);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Active") return "meter-status active";
    if (status === "Offline") return "meter-status offline";
    return "meter-status maintenance";
  };

  const getConditionClass = (condition) => {
    if (condition === "Normal") return "condition normal";
    if (condition === "High Usage") return "condition high";
    if (condition === "Possible Leak") return "condition leak";
    return "condition maintenance";
  };

  return (
    <div className="admin-water-page">
      <AdminSidebar
        activePage="Water Meters"
        onNavigate={handleNavigation}
        onLogout={() => {
          localStorage.clear();
          navigate("/login");
        }}
      />

      <main className="admin-water-main">
        {/* TOP HEADER */}
        <header className="admin-header">
          <div>
            <span className="admin-badge">WATER MANAGEMENT</span>
            <h1>Water Meters</h1>
          </div>
          <div className="admin-header-right">
            <div className="admin-user-tag">
              <span className="dot online"></span> System Admin
            </div>
          </div>
        </header>

        <div className="water-page-content">
          {/* PAGE HEADER & PRIMARY ACTION */}
          <div className="water-page-header">
            <div>
              <span className="page-eyebrow">WATER MANAGEMENT</span>
              <h1>Water Meters</h1>
              <p>
                Monitor, manage, edit and track every connected smart water meter across your property portfolio.
              </p>
            </div>

            <button
              className="primary-action-btn"
              onClick={() => navigate("/admin/add-water-meter")}
            >
              + Add Water Meters
            </button>
          </div>

          {/* KPI CARDS GRID */}
          <div className="meter-kpi-grid">
            <div className="meter-kpi-card">
              <div className="kpi-icon">📡</div>
              <div>
                <span>TOTAL INSTALLED METERS</span>
                <strong>{kpis.total} <small>Units</small></strong>
                <small>Across all property blocks</small>
              </div>
            </div>

            <div className="meter-kpi-card">
              <div className="kpi-icon green">✓</div>
              <div>
                <span>ACTIVE OPERATIONAL</span>
                <strong>{kpis.active} <small>Online</small></strong>
                <small>{kpis.activePct}% Signal Operational</small>
              </div>
            </div>

            <div className="meter-kpi-card">
              <div className="kpi-icon orange">!</div>
              <div>
                <span>OFFLINE / DISCONNECTED</span>
                <strong>{kpis.offline} <small>Units</small></strong>
                <small>Requires field check</small>
              </div>
            </div>

            <div className="meter-kpi-card">
              <div className="kpi-icon red">⚠</div>
              <div>
                <span>TELEMETRY ALERTS</span>
                <strong>{kpis.alerts} <small>Alerts</small></strong>
                <small>High consumption / Leakage</small>
              </div>
            </div>
          </div>

          {/* CONTROL TOOLBAR & SEARCH */}
          <div className="meter-toolbar">
            <div className="meter-search">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search meter by ID, Serial Number, Resident, Apartment unit, or Type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Offline">Offline</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <div className="view-toggle-btns">
              <button
                type="button"
                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                📱 Grid View
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                📄 Table View
              </button>
            </div>

            <button
              className="primary-action-btn-sm"
              onClick={() => navigate("/admin/add-water-meter")}
            >
              + Add Water Meters
            </button>
          </div>

          {/* MAIN CONNECTED METERS CONTAINER */}
          <section className="meter-section-card">
            <div className="table-heading">
              <div>
                <h2>Connected Meters List ({filteredMeters.length})</h2>
                <p>Live telemetry metrics and registered hardware parameters</p>
              </div>
              <span className="live-indicator">
                <i></i> Live Telemetry Sync
              </span>
            </div>

            {/* GRID VIEW MODE */}
            {viewMode === "grid" && (
              <div className="meters-grid-container">
                {filteredMeters.map((meter) => (
                  <div className="meter-grid-card" key={meter.id}>
                    {/* CARD HEADER */}
                    <div className="grid-card-header">
                      <div className="m-id-badge">
                        <span className="m-icon">📡</span>
                        <div>
                          <strong className="m-title">{meter.id}</strong>
                          <span className="m-sn">{meter.serialNumber || "SN-882100"}</span>
                        </div>
                      </div>
                      <div className="grid-status-col">
                        <span className={getStatusClass(meter.status)}>
                          <i></i> {meter.status}
                        </span>
                        <span className={getConditionClass(meter.condition)}>
                          {meter.condition}
                        </span>
                      </div>
                    </div>

                    {/* RESIDENT & LOCATION BAR */}
                    <div className="grid-location-bar">
                      <div className="res-name">
                        👤 <strong>{meter.resident || "Resident User"}</strong>
                      </div>
                      <div className="unit-tag">
                        🏠 {meter.building} — <strong>Unit {meter.apartment}</strong>
                      </div>
                    </div>

                    {/* METRIC SPECS GRID */}
                    <div className="grid-specs-box">
                      <div className="spec-item">
                        <span>Current Reading</span>
                        <strong className="text-primary">{meter.currentReading || meter.reading} KL</strong>
                      </div>
                      <div className="spec-item">
                        <span>Flow Rate</span>
                        <strong>{meter.flowRate}</strong>
                      </div>
                      <div className="spec-item">
                        <span>Meter Type</span>
                        <small className="type-badge">{meter.meterType || "Smart Digital"}</small>
                      </div>
                      <div className="spec-item">
                        <span>Battery & Signal</span>
                        <small className="battery-tag">
                          🔋 {meter.batteryPercentage || 95}% | 📶 {meter.signalStrength || -68} dBm
                        </small>
                      </div>
                    </div>

                    {/* CARD FOOTER INFO */}
                    <div className="grid-card-meta">
                      <span>Installed: {meter.installationDate || "15 Jan 2025"}</span>
                      <span>Ping: {meter.lastReading}</span>
                    </div>

                    {/* CARD ACTIONS BAR */}
                    <div className="grid-card-actions">
                      <button
                        type="button"
                        className="btn-card-action view"
                        onClick={() => setSelectedMeter(meter)}
                      >
                        👁️ View
                      </button>
                      <button
                        type="button"
                        className="btn-card-action edit"
                        onClick={() => setEditingMeter({ ...meter })}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-card-action usage"
                        onClick={() => navigate(`/admin/meter-readings?serial=${encodeURIComponent(meter.id)}`)}
                      >
                        📊 Usage
                      </button>
                    </div>
                  </div>
                ))}

                {filteredMeters.length === 0 && (
                  <div className="empty-state">
                    <strong>No connected water meters found</strong>
                    <p>Try matching another search keyword or status filter.</p>
                  </div>
                )}
              </div>
            )}

            {/* TABLE VIEW MODE */}
            {viewMode === "table" && (
              <div className="meter-table-wrapper">
                <table className="meter-table-custom">
                  <thead>
                    <tr>
                      <th>Meter ID / Serial</th>
                      <th>Resident & Location</th>
                      <th>Meter Type</th>
                      <th>Current Reading</th>
                      <th>Flow Rate</th>
                      <th>Telemetry</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeters.map((meter) => (
                      <tr key={meter.id}>
                        <td>
                          <strong>{meter.id}</strong>
                          <small className="tbl-sub">{meter.serialNumber}</small>
                        </td>
                        <td>
                          <strong>{meter.resident}</strong>
                          <small className="tbl-sub">{meter.building} - Unit {meter.apartment}</small>
                        </td>
                        <td>
                          <span className="type-badge">{meter.meterType || "Smart Digital"}</span>
                        </td>
                        <td>
                          <strong className="text-primary">{meter.currentReading || meter.reading} KL</strong>
                        </td>
                        <td>{meter.flowRate}</td>
                        <td>
                          <small className="battery-tag">🔋 {meter.batteryPercentage || 95}% | 📶 {meter.signalStrength || -68}dBm</small>
                        </td>
                        <td>
                          <span className={getStatusClass(meter.status)}><i></i> {meter.status}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="meter-actions">
                            <button onClick={() => setSelectedMeter(meter)}>View</button>
                            <button onClick={() => setEditingMeter({ ...meter })}>Edit</button>
                            <button onClick={() => navigate(`/admin/meter-readings?serial=${encodeURIComponent(meter.id)}`)}>Usage</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =====================================================
          1. VIEW METER DIAGNOSTICS MODAL
      ===================================================== */}
      {selectedMeter && (
        <div className="meter-modal-overlay" onClick={() => setSelectedMeter(null)}>
          <div className="meter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span>SMART METER DIAGNOSTICS AUDIT</span>
                <h2>{selectedMeter.id}</h2>
                <small className="text-sub">Serial Number: {selectedMeter.serialNumber || "SN-882100"}</small>
              </div>
              <button onClick={() => setSelectedMeter(null)}>×</button>
            </div>

            <div className="modal-status">
              <span className={getStatusClass(selectedMeter.status)}>
                <i></i> {selectedMeter.status}
              </span>
              <span className={getConditionClass(selectedMeter.condition)}>
                {selectedMeter.condition}
              </span>
            </div>

            <div className="meter-detail-grid">
              <div>
                <span>ASSIGNED RESIDENT</span>
                <strong>{selectedMeter.resident}</strong>
              </div>
              <div>
                <span>PROPERTY / UNIT</span>
                <strong>{selectedMeter.building} ({selectedMeter.apartment})</strong>
              </div>
              <div>
                <span>METER TYPE</span>
                <strong>{selectedMeter.meterType || "Smart Digital"}</strong>
              </div>
              <div>
                <span>CURRENT READING</span>
                <strong className="text-primary">{selectedMeter.currentReading || selectedMeter.reading} KL</strong>
              </div>
              <div>
                <span>FLOW RATE</span>
                <strong>{selectedMeter.flowRate}</strong>
              </div>
              <div>
                <span>BATTERY & SIGNAL</span>
                <strong>🔋 {selectedMeter.batteryPercentage || 95}% | 📶 {selectedMeter.signalStrength || -68} dBm</strong>
              </div>
              <div>
                <span>INSTALLATION DATE</span>
                <strong>{selectedMeter.installationDate || "15 Jan 2025"}</strong>
              </div>
              <div>
                <span>LAST PING UPDATE</span>
                <strong>{selectedMeter.lastReading}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setSelectedMeter(null)}>Close Diagnostics</button>
              <button onClick={() => {
                const toEdit = selectedMeter;
                setSelectedMeter(null);
                setEditingMeter({ ...toEdit });
              }}>✏️ Edit Meter Details</button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          2. LIVE EDIT METER MODAL
      ===================================================== */}
      {editingMeter && (
        <div className="meter-modal-overlay" onClick={() => setEditingMeter(null)}>
          <div className="meter-modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span>LIVE METER EDITOR</span>
                <h2>Edit Water Meter ({editingMeter.id})</h2>
              </div>
              <button onClick={() => setEditingMeter(null)}>×</button>
            </div>

            <form onSubmit={handleSaveEdit} className="edit-meter-form">
              <div className="edit-form-grid">
                <div className="form-field">
                  <label>Resident Name</label>
                  <input
                    type="text"
                    value={editingMeter.resident || ""}
                    onChange={(e) => setEditingMeter({ ...editingMeter, resident: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Apartment / Unit</label>
                  <input
                    type="text"
                    value={editingMeter.apartment || ""}
                    onChange={(e) => setEditingMeter({ ...editingMeter, apartment: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Building Name</label>
                  <input
                    type="text"
                    value={editingMeter.building || ""}
                    onChange={(e) => setEditingMeter({ ...editingMeter, building: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Meter Type</label>
                  <select
                    value={editingMeter.meterType || "Smart Digital"}
                    onChange={(e) => setEditingMeter({ ...editingMeter, meterType: e.target.value })}
                  >
                    <option value="Smart Digital">Smart Digital</option>
                    <option value="Ultrasonic">Ultrasonic</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="IoT Telemetry">IoT Telemetry</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Current Reading (KL)</label>
                  <input
                    type="text"
                    value={editingMeter.currentReading || editingMeter.reading || ""}
                    onChange={(e) => setEditingMeter({ ...editingMeter, currentReading: e.target.value, reading: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Operating Status</label>
                  <select
                    value={editingMeter.status || "Active"}
                    onChange={(e) => setEditingMeter({ ...editingMeter, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Offline">Offline</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Condition Assessment</label>
                  <select
                    value={editingMeter.condition || "Normal"}
                    onChange={(e) => setEditingMeter({ ...editingMeter, condition: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High Usage">High Usage</option>
                    <option value="Possible Leak">Possible Leak</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Flow Rate</label>
                  <input
                    type="text"
                    value={editingMeter.flowRate || ""}
                    onChange={(e) => setEditingMeter({ ...editingMeter, flowRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingMeter(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaterMeters;