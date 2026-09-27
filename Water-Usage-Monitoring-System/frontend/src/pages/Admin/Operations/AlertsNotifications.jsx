import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import { alertService } from "../../../services/alertService";
import "./AlertsNotifications.css";

function AlertsNotifications() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [evaluating, setEvaluating] = useState(false);

  /* =========================================================
     FETCH ALL ALERTS FROM BACKEND
  ========================================================= */
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertService.getAllAlerts();
      
      const formattedAlerts = data.map((item) => {
        let timestampStr = "Just now";
        if (item.createdAt) {
          const d = new Date(item.createdAt);
          timestampStr = d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        let sev = "Warning";
        if (item.severity) {
          if (item.severity.toUpperCase() === "VERY CRITICAL" || item.severity.toUpperCase() === "VERY_CRITICAL") {
            sev = "Very Critical";
          } else {
            sev = item.severity.charAt(0).toUpperCase() + item.severity.slice(1).toLowerCase();
          }
        }
        const stat = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : "Active";

        let cat = "System";
        if (item.alertType?.includes("TIER") || item.alertType === "HIGH_BILL" || item.alertType === "CRITICAL_BILL") {
          cat = "Tariff / Price Tier";
        } else if (item.alertType === "HIGH_CONSUMPTION") {
          cat = "Consumption Limit";
        } else if (item.alertType === "POTENTIAL_LEAK") {
          cat = "Statistical Leak (2σ)";
        } else if (item.alertType === "PAYMENT_RECEIVED") {
          cat = "Payment Settled";
        }

        return {
          id: item.alertRef || `ALT-${item.alertId}`,
          rawId: item.alertId,
          title: item.title,
          message: item.message,
          category: cat,
          target: item.apartmentId ? `Apartment #${item.apartmentId}` : "All Residents",
          timestamp: timestampStr,
          severity: sev,
          status: stat,
          currentValue: item.currentValue,
          expectedValue: item.expectedValue,
          differenceValue: item.differenceValue,
        };
      });

      setAlerts(formattedAlerts);
    } catch (err) {
      console.error("[AdminAlerts] Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  /* =========================================================
     ACTIONS
  ========================================================= */
  const handleResolveAlert = async (rawId) => {
    try {
      await alertService.resolveAlert(rawId);
      fetchAlerts();
    } catch (err) {
      console.error("[AdminAlerts] Error updating alert status:", err);
    }
  };

  const handleManualEvaluation = async () => {
    try {
      setEvaluating(true);
      await alertService.triggerEvaluation();
      await fetchAlerts();
    } catch (err) {
      console.error("[AdminAlerts] Error triggering manual evaluation:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Alert ID", "Title", "Category", "Target Unit", "Timestamp", "Severity", "Status", "Current Value", "Expected Value", "Difference"];
    const rows = filteredAlerts.map((a) => [
      a.id,
      a.title,
      a.category,
      a.target,
      a.timestamp,
      a.severity,
      a.status,
      a.currentValue ?? "",
      a.expectedValue ?? "",
      a.differenceValue ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SystemAlerts_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =========================================================
     FILTERED & KPI DERIVED STATE
  ========================================================= */
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q);

      const matchesSev = severityFilter === "All" || a.severity.toLowerCase() === severityFilter.toLowerCase();
      const matchesStat = statusFilter === "All" || a.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesSev && matchesStat;
    });
  }, [alerts, search, severityFilter, statusFilter]);

  const kpiTotal = alerts.length;
  const kpiCritical = alerts.filter((a) => (a.severity === "Critical" || a.severity === "Very Critical") && a.status === "Active").length;
  const kpiWarnings = alerts.filter((a) => a.severity === "Warning" && a.status === "Active").length;
  const kpiResolved = alerts.filter((a) => a.status === "Resolved" || a.severity === "Info").length;

  return (
    <div className="alerts-ops-page">
      <AdminSidebar activePage="Alerts & Notifications" />

      <main className="alerts-ops-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">OPERATIONS & SYSTEM LOGS</span>
            <h1>Alerts & System Notifications</h1>
          </div>
          <div className="admin-header-right" style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={handleManualEvaluation}
              disabled={evaluating}
              style={{ background: "#2563eb", color: "#fff", border: "none" }}
            >
              {evaluating ? "Evaluating..." : "⚡ Run Alert Engine"}
            </button>

            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              📊 Export Alerts CSV
            </button>
          </div>
        </header>

        <div className="alerts-ops-content">
          {/* KPI CARDS */}
          <section className="ops-kpi-grid">
            <div className="ops-kpi-card">
              <div className="kpi-icon-box total">🔔</div>
              <div>
                <span>TOTAL SYSTEM ALERTS</span>
                <strong>{kpiTotal} <small>Events</small></strong>
                <small>Logged in database</small>
              </div>
            </div>

            <div className="ops-kpi-card">
              <div className="kpi-icon-box critical">!</div>
              <div>
                <span>CRITICAL ALERTS</span>
                <strong className="text-danger">{kpiCritical} <small>Active</small></strong>
                <small>Action Required Immediately</small>
              </div>
            </div>

            <div className="ops-kpi-card">
              <div className="kpi-icon-box warning">⚠</div>
              <div>
                <span>WARNING NOTICES</span>
                <strong className="text-warning">{kpiWarnings} <small>Notices</small></strong>
                <small>Price & Consumption Limits</small>
              </div>
            </div>

            <div className="ops-kpi-card">
              <div className="kpi-icon-box online">✓</div>
              <div>
                <span>RESOLVED / INFO</span>
                <strong>{kpiResolved} <small>Events</small></strong>
                <small>Cleared Audits</small>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="ops-filters-card">
            <div className="rpt-search-box">
              <span className="rpt-search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search alerts by title, event ID, or target unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="rpt-filter-selects">
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="All">All Severities</option>
                <option value="Very Critical">Very Critical</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </section>

          {/* TABLE */}
          <section className="ops-table-card">
            <div className="table-header-title">
              <h3>System Event & Alert Monitoring Grid ({filteredAlerts.length})</h3>
            </div>

            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                Loading live alerts from backend...
              </div>
            ) : (
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Alert ID</th>
                    <th>Event Title & Description</th>
                    <th>Category</th>
                    <th>Target Unit</th>
                    <th>Timestamp</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((a) => (
                      <tr key={a.id}>
                        <td className="font-id">{a.id}</td>
                        <td>
                          <strong>{a.title}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>{a.message}</p>
                        </td>
                        <td><span className="charge-cat usage">{a.category}</span></td>
                        <td><strong>{a.target}</strong></td>
                        <td className="text-sub">{a.timestamp}</td>
                        <td>
                          <span className={`badge-sev ${a.severity.toLowerCase().replace(/\s+/g, "-")}`}>
                            {a.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${a.status.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className={`btn-tbl-status ${a.status === "Active" ? "activate" : "deactivate"}`}
                            onClick={() => handleResolveAlert(a.rawId)}
                          >
                            {a.status === "Active" ? "Mark Resolved" : "Reopen Alert"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="empty-table-msg">
                        No system alerts found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AlertsNotifications;
