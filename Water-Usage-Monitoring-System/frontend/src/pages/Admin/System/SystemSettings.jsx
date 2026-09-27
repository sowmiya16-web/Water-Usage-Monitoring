import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";

import "./SystemSettings.css";


const BILLING_CYCLE_OPTIONS = ["1st of month", "15th of month", "Last day of month"];
const ALERT_THRESHOLD_OPTIONS = ["25%", "50%", "75%", "100%"];


function SystemSettings() {

  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] =
    useState("1st of month");

  const [dueDays, setDueDays] =
    useState(10);

  const [alertThreshold, setAlertThreshold] =
    useState("75%");

  const [systemNotifs, setSystemNotifs] =
    useState({
      alertEmails: true,
      overdueReminders: true,
      meterOfflineAlerts: true,
      billGenerationAlerts: true,
    });

  const [saved, setSaved] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleNotif = (key) => {
    setSystemNotifs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NOTIF_ITEMS = [
    { key: "alertEmails", label: "System Alert Emails", desc: "Email alerts for critical system events." },
    { key: "overdueReminders", label: "Overdue Payment Reminders", desc: "Automatic reminders to residents with overdue bills." },
    { key: "meterOfflineAlerts", label: "Meter Offline Alerts", desc: "Notify admin when a meter goes offline." },
    { key: "billGenerationAlerts", label: "Bill Generation Confirmation", desc: "Confirm when monthly bills are generated successfully." },
  ];


  return (
    <div className="admin-page">

      <AdminSidebar activePage="System Settings" onLogout={handleLogout} />

      <main className="admin-main">
        <div className="admin-content">

          <div className="admin-page-heading">
            <div>
              <span className="admin-section-label">SYSTEM</span>
              <h2>System Settings</h2>
              <p>Configure billing cycles, alert thresholds, and system-wide notification preferences.</p>
            </div>
            {saved && (
              <span className="settings-saved-badge">✓ Settings saved</span>
            )}
          </div>

          <form onSubmit={handleSave} className="system-settings-form">

            {/* BILLING CONFIGURATION */}
            <section className="sys-settings-card">
              <div className="sys-card-header">
                <h3>Billing Configuration</h3>
                <p>Control when bills are generated and how many days residents have to pay.</p>
              </div>

              <div className="sys-settings-rows">

                <div className="sys-setting-row">
                  <div className="sys-setting-info">
                    <strong>Billing Cycle Start</strong>
                    <p>When monthly bills are generated for all residents.</p>
                  </div>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="sys-select"
                  >
                    {BILLING_CYCLE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div className="sys-setting-row">
                  <div className="sys-setting-info">
                    <strong>Payment Due Period</strong>
                    <p>Number of days after bill generation before it becomes overdue.</p>
                  </div>
                  <div className="sys-number-input">
                    <input
                      type="number"
                      min={5}
                      max={30}
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                    />
                    <span>days</span>
                  </div>
                </div>

              </div>
            </section>

            {/* ALERT THRESHOLDS */}
            <section className="sys-settings-card">
              <div className="sys-card-header">
                <h3>Alert Thresholds</h3>
                <p>Set consumption thresholds that trigger alerts for residents and operations.</p>
              </div>

              <div className="sys-settings-rows">
                <div className="sys-setting-row">
                  <div className="sys-setting-info">
                    <strong>High Consumption Alert</strong>
                    <p>Alert residents when their usage exceeds this percentage of their monthly average.</p>
                  </div>
                  <div className="filter-tabs">
                    {ALERT_THRESHOLD_OPTIONS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        className={`filter-tab ${alertThreshold === o ? "filter-tab-active" : ""}`}
                        onClick={() => setAlertThreshold(o)}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* NOTIFICATION PREFERENCES */}
            <section className="sys-settings-card">
              <div className="sys-card-header">
                <h3>System Notification Preferences</h3>
                <p>Control which automated notifications are sent by the system.</p>
              </div>

              <div className="sys-settings-rows">
                {NOTIF_ITEMS.map((item) => (
                  <div key={item.key} className="sys-setting-row">
                    <div className="sys-setting-info">
                      <strong>{item.label}</strong>
                      <p>{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${systemNotifs[item.key] ? "toggle-on" : ""}`}
                      onClick={() => toggleNotif(item.key)}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="sys-form-footer">
              <button type="submit" className="save-settings-button">
                Save Settings
              </button>
            </div>

          </form>

        </div>
      </main>
    </div>
  );
}

export default SystemSettings;
