import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./MaintenanceManagement.css";

function MaintenanceManagement() {
  const navigate = useNavigate();

  const [maintenances, setMaintenances] = useState([
    {
      id: "MNT-2026-401",
      title: "Block A Main Pipe Recalibration & Pressure Audit",
      equipment: "WM-A100 Main Sensor",
      type: "Preventive Overhaul",
      location: "Block A Substation",
      technician: "Ramesh Tech Lead",
      scheduledDate: "02 Sep 2026",
      lastMaintenance: "02 Mar 2026",
      nextMaintenance: "02 Mar 2027",
      cost: 2400.0,
      priority: "High",
      status: "Scheduled",
      scope: "Ultrasonic sensor alignment, battery replacement, and valve pressure testing.",
    },
    {
      id: "MNT-2026-400",
      title: "Block C Smart Meter Firmware Over-The-Air Patch",
      equipment: "LoRaWAN Gateway Node 04",
      type: "Firmware Update",
      location: "Block C Roof Mast",
      technician: "Infrastructure Team B",
      scheduledDate: "30 Aug 2026",
      lastMaintenance: "15 Jan 2026",
      nextMaintenance: "30 Nov 2026",
      cost: 850.0,
      priority: "Medium",
      status: "Ongoing",
      scope: "Patching LoRaWAN gateway security stack v4.2.1 and signal RSSI optimization.",
    },
    {
      id: "MNT-2026-399",
      title: "Apartment A-402 Meter Check & Seal Inspection",
      equipment: "WM-A101-2026 (Sowmiya)",
      type: "Diagnostic Inspection",
      location: "Apartment A-402 Utility Duct",
      technician: "Field Plumber Suresh",
      scheduledDate: "28 Aug 2026",
      lastMaintenance: "28 Feb 2026",
      nextMaintenance: "28 Aug 2027",
      cost: 450.0,
      priority: "Low",
      status: "Completed",
      scope: "Tamper seal audit, battery voltage check (3.65V), and optical pulse test.",
    },
    {
      id: "MNT-2026-398",
      title: "Main Overhead Water Tank Cleaning & Chlorination",
      equipment: "Society Tank Reservoir 01",
      type: "Sanitation & Cleaning",
      location: "Central Water Plant",
      technician: "Sanitation Ops Crew",
      scheduledDate: "20 Aug 2026",
      lastMaintenance: "20 Feb 2026",
      nextMaintenance: "20 Feb 2027",
      cost: 5500.0,
      priority: "High",
      status: "Completed",
      scope: "Sludge removal, high-pressure washing, and chlorination treatment.",
    },
    {
      id: "MNT-2026-397",
      title: "Block D Hydro-Pneumatic Booster Pump Maintenance",
      equipment: "Pump Unit Hydro-3",
      type: "Mechanical Servicing",
      location: "Block D Pump Room",
      technician: "Heavy Machinery Team",
      scheduledDate: "15 Aug 2026",
      lastMaintenance: "15 Feb 2026",
      nextMaintenance: "15 Feb 2027",
      cost: 3800.0,
      priority: "High",
      status: "Completed",
      scope: "Bearing lubrication, impeller clearance check, and electrical insulation test.",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMnt, setSelectedMnt] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        m.id.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.equipment.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.technician.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || m.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [maintenances, search, statusFilter]);

  const handleUpdateStatus = (id, newStatus) => {
    setMaintenances((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    setNoticeMessage(`✓ Maintenance Job #${id} status updated to ${newStatus}.`);
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Maintenance ID",
      "Job Title",
      "Equipment",
      "Type",
      "Location",
      "Technician",
      "Scheduled Date",
      "Last Maintenance",
      "Next Maintenance",
      "Estimated Cost (INR)",
      "Priority",
      "Status",
    ];

    const rows = filteredMaintenances.map((m) => [
      m.id,
      m.title,
      m.equipment,
      m.type,
      m.location,
      m.technician,
      m.scheduledDate,
      m.lastMaintenance,
      m.nextMaintenance,
      `₹${m.cost.toFixed(2)}`,
      m.priority,
      m.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MaintenanceManagement_Schedule_Log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Maintenance Management" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">SERVICE & MAINTENANCE</span>
            <h1>Infrastructure Maintenance Management</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              🔧 Export Maintenance CSV
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {noticeMessage && <div className="rpt-notice-alert-banner">{noticeMessage}</div>}

          {/* KPI CARDS */}
          <section className="reports-kpi-grid">
            <div className="report-kpi-card">
              <span>SCHEDULED MAINTENANCE</span>
              <strong>6 <small>Jobs</small></strong>
              <small>Upcoming in next 7 Days</small>
            </div>

            <div className="report-kpi-card highlight">
              <span>ONGOING WORK</span>
              <strong className="text-warning">2 <small>Active</small></strong>
              <small>Teams Currently On-Site</small>
            </div>

            <div className="report-kpi-card">
              <span>COMPLETED THIS MONTH</span>
              <strong className="text-success">24 <small>Jobs</small></strong>
              <small>100% Quality Audited</small>
            </div>

            <div className="report-kpi-card">
              <span>ESTIMATED MONTHLY BUDGET</span>
              <strong>₹12,400</strong>
              <small>Routine Equipment Upkeep</small>
            </div>
          </section>

          {/* TABLE */}
          <section className="reports-table-card">
            <div className="table-controls-row">
              <div className="rpt-search-box">
                <span className="rpt-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search maintenance job title, equipment, location, or technician..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="rpt-filter-selects">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Job Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Maintenance Scope</th>
                    <th>Equipment / Location</th>
                    <th>Type</th>
                    <th>Technician</th>
                    <th>Schedule Date</th>
                    <th>Cost (₹)</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaintenances.length > 0 ? (
                    filteredMaintenances.map((m) => (
                      <tr key={m.id}>
                        <td className="font-id">{m.id}</td>
                        <td>
                          <strong>{m.title}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.scope}
                          </p>
                        </td>
                        <td>
                          <strong>{m.equipment}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>{m.location}</p>
                        </td>
                        <td><span className="charge-cat usage">{m.type}</span></td>
                        <td>{m.technician}</td>
                        <td className="text-sub">{m.scheduledDate}</td>
                        <td><strong className="text-price">₹{m.cost.toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge-status ${m.priority.toLowerCase()}`}>
                            {m.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${m.status.toLowerCase()}`}>
                            {m.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="rpt-table-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button type="button" className="btn-tbl-view" onClick={() => setSelectedMnt(m)}>
                              Audit
                            </button>
                            {m.status !== "Completed" && (
                              <button
                                type="button"
                                className="btn-tbl-action"
                                onClick={() => handleUpdateStatus(m.id, "Completed")}
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="empty-table-msg">
                        No maintenance jobs found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* DETAIL MODAL */}
          {selectedMnt && (
            <div className="rpt-modal-backdrop" onClick={() => setSelectedMnt(null)}>
              <div className="rpt-modal-box req-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="rpt-modal-header">
                  <div>
                    <span className="rpt-modal-sub">MAINTENANCE JOB COMPREHENSIVE AUDIT</span>
                    <h3>Job #{selectedMnt.id}</h3>
                  </div>
                  <button type="button" className="rpt-btn-close-modal" onClick={() => setSelectedMnt(null)}>×</button>
                </div>

                <div className="rpt-modal-body">
                  <div className="rpt-b-hero-card">
                    <div>
                      <span>MAINTENANCE TITLE</span>
                      <strong>{selectedMnt.title}</strong>
                      <p>Equipment: {selectedMnt.equipment} • Location: {selectedMnt.location}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>STATUS</span>
                      <span className={`badge-status ${selectedMnt.status.toLowerCase()}`}>
                        {selectedMnt.status}
                      </span>
                    </div>
                  </div>

                  <div className="rpt-b-grid">
                    <div className="rpt-b-box" style={{ gridColumn: "span 2" }}>
                      <span>Engineering Scope & Technical Protocol</span>
                      <strong>{selectedMnt.scope}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Maintenance Category</span>
                      <strong>{selectedMnt.type}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Assigned Technician/Team</span>
                      <strong>{selectedMnt.technician}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Scheduled Date</span>
                      <strong>{selectedMnt.scheduledDate}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Estimated Maintenance Cost</span>
                      <strong className="text-price">₹{selectedMnt.cost.toFixed(2)}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Last Maintenance Completed</span>
                      <strong>{selectedMnt.lastMaintenance}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Next Due Cycle Date</span>
                      <strong>{selectedMnt.nextMaintenance}</strong>
                    </div>
                  </div>

                  <div className="rpt-modal-actions-bar">
                    {selectedMnt.status !== "Completed" && (
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => {
                          handleUpdateStatus(selectedMnt.id, "Completed");
                          setSelectedMnt(null);
                        }}
                      >
                        ✓ Complete Maintenance Job
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedMnt(null)}
                    >
                      Close Audit
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

export default MaintenanceManagement;
