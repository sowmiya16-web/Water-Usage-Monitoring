import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityAdminManagement() {
  const navigate = useNavigate();

  const [adminsList] = useState([
    {
      id: "ADM-001",
      name: "System Administrator",
      email: "admin@watermonitor.com",
      role: "Super Admin",
      department: "Township Infrastructure & Operations",
      status: "Active",
      lastLogin: "10 mins ago",
    },
    {
      id: "ADM-002",
      name: "Operations Manager",
      email: "manager@aquaplus.com",
      role: "Operations Admin",
      department: "Water Distribution & Maintenance",
      status: "Active",
      lastLogin: "2 hours ago",
    },
    {
      id: "ADM-003",
      name: "Billing Supervisor",
      email: "billing.admin@watermonitor.com",
      role: "Finance Admin",
      department: "Tariffs & Resident Accounts",
      status: "Active",
      lastLogin: "Yesterday",
    },
    {
      id: "ADM-004",
      name: "Hardware Dispatch Engineer",
      email: "engineer@aquaplus.com",
      role: "Field Admin",
      department: "Ultrasonic Flow Meters & IoT",
      status: "On Duty",
      lastLogin: "4 hours ago",
    },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Admin Management" />

      <main className="comm-main-content">
        {/* HEADER */}
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">AUTHORITY GOVERNANCE</span>
            <h1>Admin Management</h1>
            <p>Supervise operational administrators, security roles, and permissions</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Admin Account Creation modal initialized.")}
            >
              + Add New Administrator
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>🛡️</div>
              <div className="comm-stat-info">
                <span>Active Admins</span>
                <strong>4 Personnel</strong>
                <p>100% Security Compliant</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>🔑</div>
              <div className="comm-stat-info">
                <span>Auth Sessions</span>
                <strong>2 Active</strong>
                <p>MFA 2-Factor Verified</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>📋</div>
              <div className="comm-stat-info">
                <span>Audit Logs</span>
                <strong>1,842 Entries</strong>
                <p>Tamper-Evident Ledger</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>⚙️</div>
              <div className="comm-stat-info">
                <span>Role Types</span>
                <strong>3 Tiers</strong>
                <p>Super, Operations, Field</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Registered Administrative Accounts</h2>
                <p>Direct credentials and role access configuration across the township system</p>
              </div>
              <span className="comm-badge badge-info">4 Active Admins</span>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Admin ID</th>
                    <th>Name &amp; Role</th>
                    <th>System Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsList.map((adm) => (
                    <tr key={adm.id}>
                      <td><strong>{adm.id}</strong></td>
                      <td>
                        <strong style={{ display: "block" }}>{adm.name}</strong>
                        <span style={{ fontSize: "11px", color: "#0284c7" }}>{adm.role}</span>
                      </td>
                      <td style={{ color: "#475569" }}>{adm.email}</td>
                      <td>{adm.department}</td>
                      <td>
                        <span className="comm-badge badge-success">{adm.status}</span>
                      </td>
                      <td style={{ color: "#64748b" }}>{adm.lastLogin}</td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                          onClick={() => alert(`Reviewing permissions for ${adm.name}`)}
                        >
                          Permissions
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

export default CommunityAdminManagement;
