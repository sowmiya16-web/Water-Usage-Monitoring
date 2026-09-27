import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./ServiceRequests.css";

function ServiceRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([
    {
      id: "SR-2026-104",
      resident: "Sowmiya",
      apartment: "Apartment A-402",
      type: "Meter Calibration & Pressure Audit",
      description: "Low water pressure reported during morning peak hours (07:00-09:00 AM). Needs flow sensor recalibration.",
      priority: "High",
      date: "30 Aug 2026",
      expectedCompletion: "02 Sep 2026",
      assignedTeam: "Plumbing Team Alpha",
      status: "In-Progress",
      resolutionDetails: "Technician dispatched for line pressure test.",
    },
    {
      id: "SR-2026-103",
      resident: "Rahul Sharma",
      apartment: "Apartment A-101",
      type: "Continuous Flow Leak Inspection",
      description: "Automated meter alert triggered continuous flow of 1.4 L/min for 8 consecutive hours. Potential pipe rupture.",
      priority: "Critical",
      date: "29 Aug 2026",
      expectedCompletion: "31 Aug 2026",
      assignedTeam: "Emergency Rapid Response",
      status: "In-Progress",
      resolutionDetails: "Isolation valve closed. Repair team on site.",
    },
    {
      id: "SR-2026-102",
      resident: "Priya Sundaram",
      apartment: "Apartment B-203",
      type: "Digital LCD Backlight Replacement",
      description: "Smart meter physical LCD display backlight dimmed out. Telemetry telemetry readings still transmitting via LoRaWAN.",
      priority: "Medium",
      date: "28 Aug 2026",
      expectedCompletion: "04 Sep 2026",
      assignedTeam: "Tech Services Beta",
      status: "New",
      resolutionDetails: "Replacement LCD module queued in inventory.",
    },
    {
      id: "SR-2026-101",
      resident: "Arun Varma",
      apartment: "Apartment B-304",
      type: "Routine Annual Meter Diagnostics",
      description: "Scheduled preventive maintenance & battery check. All optical sensors verified.",
      priority: "Low",
      date: "25 Aug 2026",
      expectedCompletion: "26 Aug 2026",
      assignedTeam: "Field Maintenance Team 2",
      status: "Completed",
      resolutionDetails: "Battery health 98%. Optical seal intact.",
    },
    {
      id: "SR-2026-100",
      resident: "Vikram Malhotra",
      apartment: "Apartment C-501",
      type: "Battery Replacement Request",
      description: "Meter battery voltage dropped below 3.1V. Replaced with industrial Lithium Thionyl Chloride 3.6V cell.",
      priority: "High",
      date: "24 Aug 2026",
      expectedCompletion: "25 Aug 2026",
      assignedTeam: "Hardware Field Ops",
      status: "Completed",
      resolutionDetails: "Battery swapped. Voltage restored to 3.65V.",
    },
    {
      id: "SR-2026-099",
      resident: "Karan Kapoor",
      apartment: "Apartment D-402",
      type: "Check Valve Noise Complaint",
      description: "Chattering noise reported from backflow preventer check valve during high flow velocity.",
      priority: "Medium",
      date: "22 Aug 2026",
      expectedCompletion: "24 Aug 2026",
      assignedTeam: "Plumbing Team Alpha",
      status: "Completed",
      resolutionDetails: "Spring assembly tightened and lubricated.",
    },
    {
      id: "SR-2026-098",
      resident: "Ananya Roy",
      apartment: "Apartment E-102",
      type: "Water Quality & Chlorination Test",
      description: "Resident requested potability test after main storage tank cleaning.",
      priority: "Low",
      date: "20 Aug 2026",
      expectedCompletion: "21 Aug 2026",
      assignedTeam: "Water Quality Lab Team",
      status: "Completed",
      resolutionDetails: "TDS level 110 ppm, pH 7.2. Safe for usage.",
    },
  ]);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedReq, setSelectedReq] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        r.id.toLowerCase().includes(q) ||
        r.resident.toLowerCase().includes(q) ||
        r.apartment.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.assignedTeam.toLowerCase().includes(q);

      const matchesPriority = priorityFilter === "All" || r.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesStatus = statusFilter === "All" || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [requests, search, priorityFilter, statusFilter]);

  const handleUpdateStatus = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setNoticeMessage(`✓ Service Request #${id} status updated to ${newStatus}.`);
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Request ID",
      "Resident Name",
      "Apartment Unit",
      "Service Request Type",
      "Description",
      "Priority",
      "Date Logged",
      "Expected Completion",
      "Assigned Team",
      "Status",
      "Resolution Details",
    ];

    const rows = filteredRequests.map((r) => [
      r.id,
      r.resident,
      r.apartment,
      r.type,
      r.description,
      r.priority,
      r.date,
      r.expectedCompletion,
      r.assignedTeam,
      r.status,
      r.resolutionDetails,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ServiceRequests_Comprehensive_Log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Service Requests" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">SERVICE & MAINTENANCE</span>
            <h1>Service Requests Management</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              🛠️ Export Service Log CSV
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {noticeMessage && <div className="rpt-notice-alert-banner">{noticeMessage}</div>}

          {/* KPI CARDS */}
          <section className="reports-kpi-grid">
            <div className="report-kpi-card">
              <span>TOTAL SERVICE TICKETS</span>
              <strong>38 <small>Tickets</small></strong>
              <small>Logged in last 30 days</small>
            </div>

            <div className="report-kpi-card highlight">
              <span>NEW / UNASSIGNED</span>
              <strong>5 <small>Requests</small></strong>
              <small>Immediate Action Needed</small>
            </div>

            <div className="report-kpi-card">
              <span>IN-PROGRESS FIELD WORK</span>
              <strong className="text-warning">12 <small>Active</small></strong>
              <small>Dispatched Engineering Crews</small>
            </div>

            <div className="report-kpi-card">
              <span>COMPLETED RESOLUTIONS</span>
              <strong className="text-success">21 <small>Resolved</small></strong>
              <small>Avg Turnaround: 3.5 Hours</small>
            </div>
          </section>

          {/* SEARCH & FILTERS */}
          <section className="reports-table-card" style={{ border: "1px solid #e2e8f0" }}>
            <div className="table-controls-row">
              <div className="rpt-search-box">
                <span className="rpt-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search request ID, resident, apartment, or service description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="rpt-filter-selects" style={{ display: "flex", gap: "10px" }}>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* REQUESTS TABLE */}
            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Resident & Unit</th>
                    <th>Service Type</th>
                    <th>Priority</th>
                    <th>Logged Date</th>
                    <th>Target Completion</th>
                    <th>Assigned Team</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((r) => (
                      <tr key={r.id}>
                        <td className="font-id">{r.id}</td>
                        <td>
                          <strong>{r.resident}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>{r.apartment}</p>
                        </td>
                        <td>
                          <strong>{r.type}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.description}
                          </p>
                        </td>
                        <td>
                          <span className={`badge-status ${r.priority.toLowerCase()}`}>
                            {r.priority}
                          </span>
                        </td>
                        <td className="text-sub">{r.date}</td>
                        <td className="text-sub">{r.expectedCompletion}</td>
                        <td><strong>{r.assignedTeam}</strong></td>
                        <td>
                          <span className={`badge-status ${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="rpt-table-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button type="button" className="btn-tbl-view" onClick={() => setSelectedReq(r)}>
                              Details
                            </button>
                            {r.status !== "Completed" && (
                              <button
                                type="button"
                                className="btn-tbl-action"
                                onClick={() => handleUpdateStatus(r.id, "Completed")}
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="empty-table-msg">
                        No service requests found for "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* REQUEST DETAILS MODAL */}
          {selectedReq && (
            <div className="rpt-modal-backdrop" onClick={() => setSelectedReq(null)}>
              <div className="rpt-modal-box req-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="rpt-modal-header">
                  <div>
                    <span className="rpt-modal-sub">SERVICE TICKET COMPREHENSIVE AUDIT</span>
                    <h3>Request #{selectedReq.id}</h3>
                  </div>
                  <button type="button" className="rpt-btn-close-modal" onClick={() => setSelectedReq(null)}>×</button>
                </div>

                <div className="rpt-modal-body">
                  <div className="rpt-b-hero-card">
                    <div>
                      <span>APPLICANT RESIDENT</span>
                      <strong>{selectedReq.resident}</strong>
                      <p>{selectedReq.apartment}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>PRIORITY & STATUS</span>
                      <span className={`badge-status ${selectedReq.status.toLowerCase()}`}>
                        {selectedReq.status}
                      </span>
                    </div>
                  </div>

                  <div className="rpt-b-grid">
                    <div className="rpt-b-box" style={{ gridColumn: "span 2" }}>
                      <span>Service Request Title & Scope</span>
                      <strong>{selectedReq.type}</strong>
                      <p className="text-sub" style={{ marginTop: "4px" }}>{selectedReq.description}</p>
                    </div>
                    <div className="rpt-b-box">
                      <span>Assigned Engineering Team</span>
                      <strong>{selectedReq.assignedTeam}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Priority Tier</span>
                      <strong>{selectedReq.priority}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Date Logged</span>
                      <strong>{selectedReq.date}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Expected Completion Date</span>
                      <strong>{selectedReq.expectedCompletion}</strong>
                    </div>
                    <div className="rpt-b-box" style={{ gridColumn: "span 2" }}>
                      <span>Resolution Status & Engineering Log</span>
                      <strong>{selectedReq.resolutionDetails}</strong>
                    </div>
                  </div>

                  <div className="rpt-modal-actions-bar">
                    {selectedReq.status !== "Completed" && (
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => {
                          handleUpdateStatus(selectedReq.id, "Completed");
                          setSelectedReq(null);
                        }}
                      >
                        ✓ Mark Ticket Completed
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedReq(null)}
                    >
                      Close Ticket
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

export default ServiceRequests;
