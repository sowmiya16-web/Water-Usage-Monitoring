import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import "./AccountSettings.css";

function AccountSettings() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();

  const [prefs, setPrefs] = useState({
    pushNotifications: true,
    billReminders: true,
    usageAlerts: true,
    leakWarningAlerts: true,
    maintenanceNotices: true,
    paymentConfirmations: true,
    autoPay: false,
    twoFactorAuth: false,
    eInvoice: true,
  });

  const [leakThreshold, setLeakThreshold] = useState(25);

  const [profileData, setProfileData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    apartment: profile.apartment,
  });

  // Keep local form in sync if profile changes
  useEffect(() => {
    setProfileData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      apartment: profile.apartment,
    });
  }, [profile]);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const togglePref = (key) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess(false);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!passwordData.current) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (passwordData.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordData.next !== passwordData.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSuccess(true);
    setPasswordData({ current: "", next: "", confirm: "" });
    setShowPasswordForm(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      apartment: profileData.apartment,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 4000);
  };

  const PREF_ITEMS = [
    {
      key: "pushNotifications",
      title: "Push Notifications",
      description: "Receive instant updates on your mobile device & browser.",
    },
    {
      key: "billReminders",
      title: "Bill Payment Reminders",
      description: "Get notified 5 days prior to due date to avoid late fees.",
    },
    {
      key: "usageAlerts",
      title: "Water Usage Spike Alerts",
      description: "Receive alerts when daily consumption exceeds 1.0 KL.",
    },
    {
      key: "leakWarningAlerts",
      title: "Continuous Flow / Leak Detector Alerts",
      description: "Immediate notification if continuous flow is detected overnight.",
    },
    {
      key: "maintenanceNotices",
      title: "Scheduled Maintenance Notices",
      description: "Stay informed about community tank cleaning and pipe maintenance.",
    },
  ];

  return (
    <div className="settings-page">
      <Sidebar activePage="Account Settings" onLogout={handleLogout} />

      <main className="settings-main">
        <Header activePage="Account Settings" />

        <div className="settings-content">
          {/* HEADER */}
          <div className="settings-heading-card">
            <div>
              <span className="section-label">ACCOUNT & PREFERENCES</span>
              <h2>Account Settings</h2>
              <p>Manage your profile, notification alerts, water threshold limits, and security controls for {profile.name}'s account.</p>
            </div>

            <div className="account-status-badge">
              <span className="badge-dot"></span>
              Account Status: <strong>ACTIVE</strong>
            </div>
          </div>

          {/* 2-COLUMN FULL-SCREEN GRID */}
          <div className="settings-grid-layout">
            {/* LEFT COLUMN: PROFILE & BILLING PREFERENCES */}
            <div className="settings-column">
              {/* PERSONAL INFO CARD */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h3>Resident Profile Information</h3>
                    <p>Update your registered contact details and unit profile.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="profile-settings-form">
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Apartment Unit</label>
                      <input
                        type="text"
                        value={profileData.apartment}
                        onChange={(e) => setProfileData({ ...profileData, apartment: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Primary Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Contact Phone Number</label>
                      <input
                        type="text"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-action-row">
                    {profileSaved && <span className="saved-msg">✓ Settings saved successfully!</span>}
                    <button type="submit" className="btn-save-settings">Save Profile Changes</button>
                  </div>
                </form>
              </section>

              {/* WATER ALERT THRESHOLDS */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h3>Water Quota & Leak Alert Thresholds</h3>
                    <p>Set automated notifications when monthly consumption reaches your threshold.</p>
                  </div>
                </div>

                <div className="threshold-setting-box">
                  <div className="threshold-header">
                    <span>Monthly Alert Limit</span>
                    <strong>{leakThreshold} KL / Month</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={leakThreshold}
                    onChange={(e) => setLeakThreshold(Number(e.target.value))}
                    className="threshold-slider"
                  />
                  <div className="threshold-labels">
                    <span>10 KL (Conservative)</span>
                    <span>25 KL (Standard)</span>
                    <span>50 KL (High)</span>
                  </div>
                  <p className="threshold-tip">
                    💡 You will receive an SMS and email notification when consumption hits {Math.round(leakThreshold * 0.8)} KL (80% quota).
                  </p>
                </div>
              </section>

              {/* BILLING & AUTO-PAY */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h3>Billing & Auto-Pay Options</h3>
                    <p>Manage payment convenience and paperless billing choices.</p>
                  </div>
                </div>

                <div className="settings-rows">
                  <div className="setting-row">
                    <div className="setting-row-info">
                      <strong>Auto-Debit Monthly Bill</strong>
                      <p>Automatically pay your water bill on the 5th of every month using saved payment method.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${prefs.autoPay ? "toggle-on" : ""}`}
                      onClick={() => togglePref("autoPay")}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>

                  <div className="setting-row">
                    <div className="setting-row-info">
                      <strong>Paperless E-Invoice (Email)</strong>
                      <p>Receive detailed PDF invoices sent to {profile.email} upon bill generation.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${prefs.eInvoice ? "toggle-on" : ""}`}
                      onClick={() => togglePref("eInvoice")}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: NOTIFICATION PREFERENCES & SECURITY */}
            <div className="settings-column">
              {/* NOTIFICATION PREFERENCES */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h3>Notification Channels & Alerts</h3>
                    <p>Customize which alerts WaterFlow sends to {profile.name}'s device.</p>
                  </div>
                </div>

                <div className="settings-rows">
                  {PREF_ITEMS.map((item) => (
                    <div key={item.key} className="setting-row">
                      <div className="setting-row-info">
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>

                      <button
                        type="button"
                        className={`toggle-switch ${prefs[item.key] ? "toggle-on" : ""}`}
                        onClick={() => togglePref(item.key)}
                      >
                        <span className="toggle-knob" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECURITY & LOGIN */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h3>Account Security & Authentication</h3>
                    <p>Keep your login credentials and active sessions secure.</p>
                  </div>
                </div>

                <div className="settings-rows">
                  <div className="setting-row">
                    <div className="setting-row-info">
                      <strong>Change Account Password</strong>
                      <p>{passwordSuccess ? "✓ Password updated successfully!" : "Update your password periodically for safety."}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-action-outline"
                      onClick={() => {
                        setShowPasswordForm(!showPasswordForm);
                        setPasswordError("");
                      }}
                    >
                      {showPasswordForm ? "Cancel" : "Change Password"}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form className="password-form-box" onSubmit={handleSavePassword}>
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          name="current"
                          value={passwordData.current}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          name="next"
                          value={passwordData.next}
                          onChange={handlePasswordChange}
                          placeholder="Min 8 characters"
                        />
                      </div>

                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          name="confirm"
                          value={passwordData.confirm}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                        />
                      </div>

                      {passwordError && <span className="pw-error-text">{passwordError}</span>}

                      <button type="submit" className="btn-save-settings">Save New Password</button>
                    </form>
                  )}

                  <div className="setting-row">
                    <div className="setting-row-info">
                      <strong>Two-Factor Authentication (2FA)</strong>
                      <p>Require an SMS verification code whenever logging in from a new device.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${prefs.twoFactorAuth ? "toggle-on" : ""}`}
                      onClick={() => togglePref("twoFactorAuth")}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                </div>

                <div className="active-sessions-box">
                  <h4>Active Logged-In Sessions</h4>
                  <div className="session-item">
                    <span className="device-icon">💻</span>
                    <div>
                      <strong>Windows PC (Current Session)</strong>
                      <p>Chrome Browser • IP: 192.168.1.45 • Active now</p>
                    </div>
                    <span className="badge-active-session">THIS DEVICE</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountSettings;