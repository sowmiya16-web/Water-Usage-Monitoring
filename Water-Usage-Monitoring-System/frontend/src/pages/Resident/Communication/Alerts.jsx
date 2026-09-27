import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import { alertService } from "../../../services/alertService";

import "./Alerts.css";

const SEVERITY_MAP = {
  critical: { label: "Critical", icon: "⚠" },
  warning: { label: "Warning", icon: "△" },
  info: { label: "Info", icon: "◉" },
  success: { label: "Success", icon: "✓" },
};

const FILTER_TABS = [
  { key: "All", label: "All" },
  { key: "active", label: "Active" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     FETCH ALERTS FROM BACKEND
  ========================================================= */
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertService.getAllAlerts();
      
      // Transform backend Alert objects to match frontend display format
      const formattedAlerts = data.map((item) => {
        const severityKey = (item.severity || "warning").toLowerCase();
        
        // Format date and time
        let dateStr = "Today";
        let timeStr = "";
        if (item.createdAt) {
          const d = new Date(item.createdAt);
          dateStr = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
          timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        }

        return {
          id: item.alertId,
          alertRef: item.alertRef,
          title: item.title,
          message: item.message,
          type: SEVERITY_MAP[severityKey] ? severityKey : "warning",
          date: dateStr,
          time: timeStr,
          acknowledged: Boolean(item.acknowledged),
          currentValue: item.currentValue,
          expectedValue: item.expectedValue,
          differenceValue: item.differenceValue,
          status: item.status,
        };
      });

      setAlerts(formattedAlerts);
      setErrorMessage("");
    } catch (err) {
      console.error("Failed to load alerts from backend:", err);
      setErrorMessage("Could not connect to alert service. Showing cached alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh alerts every 15 seconds to receive scheduled @Scheduled updates
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  /* =========================================================
     HANDLERS
  ========================================================= */
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const acknowledgeAlert = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      setAlerts((items) =>
        items.map((item) =>
          item.id === id ? { ...item, acknowledged: true } : item
        )
      );
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const acknowledgeAll = async () => {
    try {
      await alertService.acknowledgeAllAlerts();
      setAlerts((items) =>
        items.map((item) => ({
          ...item,
          acknowledged: true,
        }))
      );
    } catch (err) {
      console.error("Failed to acknowledge all alerts:", err);
    }
  };

  /* =========================================================
     DERIVED STATE
  ========================================================= */
  const filtered = alerts.filter((a) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "active") return !a.acknowledged;
    return a.type === activeFilter;
  });

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="alerts-page">
      <Sidebar activePage="Alerts" onLogout={handleLogout} />

      <main className="alerts-main">
        <Header activePage="Alerts" />

        <div className="alerts-content">
          {/* PAGE HEADING */}
          <div className="alerts-heading">
            <div>
              <span className="section-label">COMMUNICATION & ALERTS</span>
              <h2>
                System Alerts
                {activeCount > 0 && (
                  <span className="active-badge">{activeCount} active</span>
                )}
              </h2>
              <p>
                Automated high-bill overcharge notices, consumption warnings, and 2σ statistical leak alerts.
              </p>
            </div>

            {activeCount > 0 && (
              <button
                type="button"
                className="acknowledge-all-button"
                onClick={acknowledgeAll}
              >
                Acknowledge all
              </button>
            )}
          </div>

          {errorMessage && (
            <div style={{ color: "#e11d48", padding: "10px", background: "#ffe4e6", borderRadius: "6px", marginBottom: "15px" }}>
              {errorMessage}
            </div>
          )}

          {/* FILTER TABS */}
          <div className="alerts-filters">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab ${
                  activeFilter === tab.key ? "filter-tab-active" : ""
                }`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
                {tab.key === "active" && activeCount > 0 && (
                  <span className="tab-count">{activeCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ALERTS LIST */}
          <section className="alerts-list">
            {loading ? (
              <div className="alerts-empty">
                <p>Loading active system alerts from database...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="alerts-empty">
                <span>✓</span>
                <p>No alerts in this category.</p>
              </div>
            ) : (
              filtered.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item alert-${alert.type} ${
                    alert.acknowledged ? "alert-acknowledged" : ""
                  }`}
                >
                  <div className={`alert-icon-box icon-${alert.type}`}>
                    {SEVERITY_MAP[alert.type]?.icon || "⚠"}
                  </div>

                  <div className="alert-body">
                    <div className="alert-title-row">
                      <span className={`severity-badge badge-${alert.type}`}>
                        {SEVERITY_MAP[alert.type]?.label || alert.type}
                      </span>
                      <strong>{alert.title}</strong>
                    </div>

                    <p>{alert.message}</p>

                    {(alert.currentValue !== null && alert.currentValue !== undefined) && (
                      <div style={{ margin: "6px 0", fontSize: "13px", color: "#475569" }}>
                        <span>Current: <strong>{alert.currentValue}</strong></span>
                        {alert.expectedValue !== null && (
                          <span style={{ marginLeft: "15px" }}>Expected: <strong>{alert.expectedValue}</strong></span>
                        )}
                        {alert.differenceValue !== null && (
                          <span style={{ marginLeft: "15px", color: "#dc2626" }}>Difference: <strong>+{alert.differenceValue}</strong></span>
                        )}
                      </div>
                    )}

                    <div className="alert-meta">
                      <small>{alert.time}</small>
                      <small>{alert.date}</small>
                      {alert.alertRef && <small style={{ fontWeight: "bold" }}>{alert.alertRef}</small>}
                    </div>
                  </div>

                  <div className="alert-action">
                    {alert.acknowledged ? (
                      <span className="acknowledged-label">✓ Acknowledged</span>
                    ) : (
                      <button
                        type="button"
                        className="acknowledge-button"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Alerts;