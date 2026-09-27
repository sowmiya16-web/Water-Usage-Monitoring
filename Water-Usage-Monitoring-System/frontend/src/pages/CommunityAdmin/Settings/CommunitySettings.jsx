import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunitySettings() {
  const [societyName, setSocietyName] = useState("Aqua Plus Royal Palm Residency");
  const [leadAdminEmail, setLeadAdminEmail] = useState("communityadmin@watermonitor.com");
  const [alertPhone, setAlertPhone] = useState("+91 98765 00000");
  const [autoBillingDate, setAutoBillingDate] = useState("1");
  const [twoSigmaSensitivity, setTwoSigmaSensitivity] = useState("High (2.0 SD)");
  const [savedMessage, setSavedMessage] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage("Community configuration settings updated successfully.");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Settings" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">SYSTEM CONFIGURATION</span>
            <h1>Settings</h1>
            <p>Society profiles, IoT alert thresholds, and automated billing parameters</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={handleSave}
            >
              💾 Save All Changes
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          {savedMessage && (
            <div
              style={{
                background: "#dcfce7",
                border: "1px solid #86efac",
                color: "#166534",
                padding: "12px 18px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: "700",
              }}
            >
              ✓ {savedMessage}
            </div>
          )}

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Community Society Information</h2>
                <p>Township identification and primary contact details</p>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Society / Complex Name</label>
                <input
                  type="text"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Primary Community Admin Email</label>
                <input
                  type="email"
                  value={leadAdminEmail}
                  onChange={(e) => setLeadAdminEmail(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Emergency Plumbing Helpline</label>
                <input
                  type="text"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Monthly Auto-Billing Day of Month</label>
                <select
                  value={autoBillingDate}
                  onChange={(e) => setAutoBillingDate(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="1">1st of each month</option>
                  <option value="5">5th of each month</option>
                  <option value="15">15th of each month</option>
                  <option value="28">28th of each month</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>2-Sigma Leak Engine Sensitivity</label>
                <select
                  value={twoSigmaSensitivity}
                  onChange={(e) => setTwoSigmaSensitivity(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="Ultra (1.5 SD)">Ultra Sensitive (1.5 Sigma)</option>
                  <option value="High (2.0 SD)">High Standard (2.0 Sigma - Recommended)</option>
                  <option value="Moderate (2.5 SD)">Moderate (2.5 Sigma)</option>
                  <option value="Lenient (3.0 SD)">Lenient (3.0 Sigma)</option>
                </select>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CommunitySettings;
