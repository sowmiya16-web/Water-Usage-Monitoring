import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityUserAccounts() {
  const [accounts] = useState([
    { id: "ACC-101", user: "Sowmiya", email: "sowmiya@gmail.com", role: "Resident", status: "Active", lastLogin: "30 Aug 2026, 03:42 PM", mfa: "Enabled" },
    { id: "ACC-102", user: "Rahul Sharma", email: "rahul.sharma@example.com", role: "Resident", status: "Active", lastLogin: "30 Aug 2026, 02:15 PM", mfa: "Enabled" },
    { id: "ACC-103", user: "Priya Sundaram", email: "priya.s@example.com", role: "Resident", status: "Active", lastLogin: "30 Aug 2026, 11:30 AM", mfa: "Disabled" },
    { id: "ACC-104", user: "System Administrator", email: "admin@watermonitor.com", role: "Admin", status: "Active", lastLogin: "Just now", mfa: "Enforced" },
    { id: "ACC-105", user: "Operations Manager", email: "manager@aquaplus.com", role: "Admin", status: "Active", lastLogin: "2 hours ago", mfa: "Enforced" },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="User Accounts" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">IDENTITY & ACCESS</span>
            <h1>User Accounts</h1>
            <p>Manage system credentials, login authentications, and account statuses</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Create User Account initiated.")}
            >
              + Create User Account
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>👤</div>
              <div className="comm-stat-info">
                <span>Total Accounts</span>
                <strong>146 Accounts</strong>
                <p>142 Residents • 4 Admins</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>🔒</div>
              <div className="comm-stat-info">
                <span>Security Status</span>
                <strong>98.5% Secure</strong>
                <p>Zero Breaches Detected</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>⚡</div>
              <div className="comm-stat-info">
                <span>Active Sessions</span>
                <strong>42 Concurrent</strong>
                <p>Live Web & App Users</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>🛡️</div>
              <div className="comm-stat-info">
                <span>2FA Enabled</span>
                <strong>128 Users</strong>
                <p>87% Adoption Rate</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Central Identity Directory</h2>
                <p>All platform credentials, roles, and security policies</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Account ID</th>
                    <th>User Full Name</th>
                    <th>Login Email</th>
                    <th>Role Privilege</th>
                    <th>Account Status</th>
                    <th>2FA Security</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td><strong>{acc.id}</strong></td>
                      <td><strong>{acc.user}</strong></td>
                      <td style={{ color: "#475569" }}>{acc.email}</td>
                      <td>
                        <span className={`comm-badge ${acc.role === "Admin" ? "badge-purple" : "badge-info"}`}>
                          {acc.role}
                        </span>
                      </td>
                      <td>
                        <span className="comm-badge badge-success">{acc.status}</span>
                      </td>
                      <td>
                        <span className={`comm-badge ${acc.mfa === "Disabled" ? "badge-warning" : "badge-success"}`}>
                          {acc.mfa}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{acc.lastLogin}</td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                          onClick={() => alert(`Managing credentials for ${acc.email}`)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CommunityUserAccounts;
