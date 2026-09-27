import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./IssueTracking.css";

function IssueTracking() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([
    {
      id: "ISS-2026-801",
      type: "Continuous Leak Warning",
      title: "Abnormal Continuous Flow Spike Alert",
      reportedBy: "System Sensor Automated Diagnostic",
      unit: "Apartment B-203 (Priya)",
      reportedDate: "30 Aug 2026",
      expectedResolution: "31 Aug 2026",
      priority: "Critical",
      assignedTeam: "Rapid Leak Mitigation Unit",
      avgResolveTime: "2.5 Hours",
      rootCause: "Faulty internal flush valve seal letting water run continuously.",
      resolutionDetails: "Technician isolated supply line; replacement valve seal fitted.",
      status: "Open",
    },
    {
      id: "ISS-2026-800",
      type: "Telemetry Disconnection",
      title: "Gateway Telemetry Signal Dropped (-98 dBm)",
      reportedBy: "Network Monitor Daemon",
      unit: "Apartment C-501 (Vikram)",
      reportedDate: "29 Aug 2026",
      expectedResolution: "01 Sep 2026",
      priority: "High",
      assignedTeam: "LoRaWAN Network Infrastructure",
      avgResolveTime: "4.0 Hours",
      rootCause: "RF interference from new high-voltage duct installation on 5th floor.",
      resolutionDetails: "Adjusted gateway antenna gain & re-routed signal channel.",
      status: "In-Progress",
    },
    {
      id: "ISS-2026-799",
      type: "Billing Discrepancy",
      title: "Resident Portal Payment Gateway Auto-Retry Sync",
      reportedBy: "Sowmiya (Resident)",
      unit: "Apartment A-402 (Sowmiya)",
      reportedDate: "28 Aug 2026",
      expectedResolution: "28 Aug 2026",
      priority: "Medium",
      assignedTeam: "Billing Systems Engineering",
      avgResolveTime: "1.2 Hours",
      rootCause: "Bank gateway webhook response delay during UPI settlement.",
      resolutionDetails: "Manually reconciled webhook payload; updated invoice to Paid.",
      status: "Resolved",
    },
    {
      id: "ISS-2026-798",
      type: "Tariff Calculation Error",
      title: "Incorrect Slab Rate Applied on Peak Usage",
      reportedBy: "Karan Kapoor (Resident)",
      unit: "Apartment D-402 (Karan)",
      reportedDate: "25 Aug 2026",
      expectedResolution: "26 Aug 2026",
      priority: "Low",
      assignedTeam: "Finance Audit Team",
      avgResolveTime: "3.0 Hours",
      rootCause: "Legacy billing rule applied commercial tariff instead of residential.",
      resolutionDetails: "Re-calculated bill under Residential Slab 2; issued ₹120 credit note.",
      status: "Resolved",
    },
    {
      id: "ISS-2026-797",
      type: "Physical Damage Alert",
      title: "Smart Meter Utility Box Cover Latch Broken",
      reportedBy: "Field Inspector Suresh",
      unit: "Apartment E-102 (Ananya)",
      reportedDate: "20 Aug 2026",
      expectedResolution: "21 Aug 2026",
      priority: "Low",
      assignedTeam: "Hardware Field Ops",
      avgResolveTime: "2.0 Hours",
      rootCause: "Accidental impact during corridor painting work.",
      resolutionDetails: "Replaced polycarbonate meter box enclosure.",
      status: "Resolved",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch =
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.reportedBy.toLowerCase().includes(q) ||
        i.unit.toLowerCase().includes(q) ||
        i.assignedTeam.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || i.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [issues, search, statusFilter]);

  const handleResolveIssue = (id) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "Resolved" } : i))
    );
    setNoticeMessage(`✓ System Issue #${id} marked as RESOLVED.`);
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Issue ID",
      "Issue Category",
      "Title",
      "Reported By",
      "Affected Unit",
      "Reported Date",
      "Target Resolution",
      "Priority",
      "Assigned Team",
      "Resolution Time",
      "Root Cause",
      "Status",
    ];

    const rows = filteredIssues.map((i) => [
      i.id,
      i.type,
      i.title,
      i.reportedBy,
      i.unit,
      i.reportedDate,
      i.expectedResolution,
      i.priority,
      i.assignedTeam,
      i.avgResolveTime,
      i.rootCause,
      i.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IssueTracking_AuditLog.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Issue & Resolution Tracking" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">SERVICE & MAINTENANCE</span>
            <h1>Issue & Resolution Tracking</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              📋 Export Issues CSV
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {noticeMessage && <div className="rpt-notice-alert-banner">{noticeMessage}</div>}

          {/* KPI CARDS */}
          <section className="reports-kpi-grid">
            <div className="report-kpi-card">
              <span>OPEN ISSUES</span>
              <strong className="text-warning">14 <small>Active</small></strong>
              <small>Under Active Investigation</small>
            </div>

            <div className="report-kpi-card highlight">
              <span>CRITICAL ESCALATIONS</span>
              <strong className="text-danger">2 <small>Critical</small></strong>
              <small>Immediate Action Mandated</small>
            </div>

            <div className="report-kpi-card">
              <span>RESOLVED (THIS MONTH)</span>
              <strong className="text-success">42 <small>Resolved</small></strong>
              <small>95.4% SLA Compliance</small>
            </div>

            <div className="report-kpi-card">
              <span>AVG RESOLUTION TIME</span>
              <strong>4.2 <small>Hours</small></strong>
              <small>Target Benchmark: &lt; 6.0 Hours</small>
            </div>
          </section>

          {/* TABLE */}
          <section className="reports-table-card">
            <div className="table-controls-row">
              <div className="rpt-search-box">
                <span className="rpt-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search issue ID, title, reported by, unit, or assigned team..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="rpt-filter-selects">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Issue Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Issue ID</th>
                    <th>Issue Title & Type</th>
                    <th>Reported By & Unit</th>
                    <th>Reported Date</th>
                    <th>Target Resolution</th>
                    <th>Priority</th>
                    <th>Assigned Team</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((i) => (
                      <tr key={i.id}>
                        <td className="font-id">{i.id}</td>
                        <td>
                          <strong>{i.title}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>Category: {i.type}</p>
                        </td>
                        <td>
                          <strong>{i.reportedBy}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>{i.unit}</p>
                        </td>
                        <td className="text-sub">{i.reportedDate}</td>
                        <td className="text-sub">{i.expectedResolution}</td>
                        <td>
                          <span className={`badge-status ${i.priority.toLowerCase()}`}>
                            {i.priority}
                          </span>
                        </td>
                        <td><strong>{i.assignedTeam}</strong></td>
                        <td>
                          <span className={`badge-status ${i.status.toLowerCase()}`}>
                            {i.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="rpt-table-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button type="button" className="btn-tbl-view" onClick={() => setSelectedIssue(i)}>
                              Audit
                            </button>
                            {i.status !== "Resolved" && (
                              <button
                                type="button"
                                className="btn-tbl-action"
                                onClick={() => handleResolveIssue(i.id)}
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
                        No system issues found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ISSUE DETAIL MODAL */}
          {selectedIssue && (
            <div className="rpt-modal-backdrop" onClick={() => setSelectedIssue(null)}>
              <div className="rpt-modal-box req-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="rpt-modal-header">
                  <div>
                    <span className="rpt-modal-sub">ROOT CAUSE & ISSUE DIAGNOSTICS</span>
                    <h3>Issue #{selectedIssue.id}</h3>
                  </div>
                  <button type="button" className="rpt-btn-close-modal" onClick={() => setSelectedIssue(null)}>×</button>
                </div>

                <div className="rpt-modal-body">
                  <div className="rpt-b-hero-card">
                    <div>
                      <span>ISSUE TITLE</span>
                      <strong>{selectedIssue.title}</strong>
                      <p>Reported By: {selectedIssue.reportedBy} ({selectedIssue.unit})</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>STATUS</span>
                      <span className={`badge-status ${selectedIssue.status.toLowerCase()}`}>
                        {selectedIssue.status}
                      </span>
                    </div>
                  </div>

                  <div className="rpt-b-grid">
                    <div className="rpt-b-box" style={{ gridColumn: "span 2" }}>
                      <span>Root Cause Analysis</span>
                      <strong>{selectedIssue.rootCause}</strong>
                    </div>
                    <div className="rpt-b-box" style={{ gridColumn: "span 2" }}>
                      <span>Engineering Resolution Details</span>
                      <strong>{selectedIssue.resolutionDetails}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Assigned Resolution Team</span>
                      <strong>{selectedIssue.assignedTeam}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Priority Escalation</span>
                      <strong>{selectedIssue.priority}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Reported Date</span>
                      <strong>{selectedIssue.reportedDate}</strong>
                    </div>
                    <div className="rpt-b-box">
                      <span>Target Resolution Benchmark</span>
                      <strong>{selectedIssue.expectedResolution}</strong>
                    </div>
                  </div>

                  <div className="rpt-modal-actions-bar">
                    {selectedIssue.status !== "Resolved" && (
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => {
                          handleResolveIssue(selectedIssue.id);
                          setSelectedIssue(null);
                        }}
                      >
                        ✓ Mark Issue Resolved
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedIssue(null)}
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

export default IssueTracking;
