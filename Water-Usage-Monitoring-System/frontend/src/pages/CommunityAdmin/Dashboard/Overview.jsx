import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";
import "./Overview.css";

function CommunityAdminOverview() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const communityStats = [
    {
      label: "Total Community Residents",
      value: "142 Units",
      subtext: "138 Active • 4 Vacant",
      icon: "👥",
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
    },
    {
      label: "Society Water Flow Rate",
      value: "140.5 L/min",
      subtext: "Avg 94.8 KL Daily Flow",
      icon: "💧",
      iconBg: "#e8f8f7",
      iconColor: "#078f91",
    },
    {
      label: "Society Billed Revenue",
      value: "₹1,24,500",
      subtext: "94.2% Collection Rate",
      icon: "💳",
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "Smart IoT Meter Coverage",
      value: "142 / 142",
      subtext: "139 Online • 3 Alerted",
      icon: "📡",
      iconBg: "#f3e8ff",
      iconColor: "#7e22ce",
    },
  ];

  const communityModules = [
    { name: "Residents", path: "/community-admin/residents", icon: "👥", desc: "142 Registered Households & Occupancy" },
    { name: "Admin Management", path: "/community-admin/admin-management", icon: "🛡️", desc: "System Operators & Role Permissions" },
    { name: "User Accounts", path: "/community-admin/user-accounts", icon: "📋", desc: "User Credentials & Multi-Portal Access" },
    { name: "Water Meters", path: "/community-admin/water-meters", icon: "📡", desc: "IoT Hardware & Ultrasonic Telemetry" },
    { name: "Consumption Monitoring", path: "/community-admin/consumption-monitoring", icon: "💧", desc: "Society Consumption Trends & Flow Rates" },
    { name: "Billing & Payments", path: "/community-admin/billing-payments", icon: "💳", desc: "Invoice Dispatches & Collection Ledger" },
    { name: "Tariff Management", path: "/community-admin/tariff-management", icon: "⚙️", desc: "Slab Rates, Subsidies & Commercial Tiers" },
    { name: "Alerts & Notifications", path: "/community-admin/alerts-notifications", icon: "🔔", desc: "Leak Detection, 2-Sigma & Broadcasts" },
    { name: "Reports", path: "/community-admin/reports", icon: "📈", desc: "Audits, Volume Balances & Export Tools" },
    { name: "Settings", path: "/community-admin/settings", icon: "💻", desc: "Society Configuration & Security Policies" },
  ];

  const recentIncidents = [
    {
      id: "INC-2026-081",
      area: "Apartment B-203 (Priya Sundaram)",
      type: "High Flow Leak Alarm",
      status: "Investigating",
      time: "15 mins ago",
      level: "badge-danger",
    },
    {
      id: "INC-2026-080",
      area: "Block A Main Riser",
      type: "Valve Calibration Verified",
      status: "Resolved",
      time: "1 hour ago",
      level: "badge-success",
    },
    {
      id: "INC-2026-079",
      area: "Tower C Pump Station",
      type: "Pressure Sensor Test Passed",
      status: "Healthy",
      time: "3 hours ago",
      level: "badge-info",
    },
    {
      id: "INC-2026-078",
      area: "Apartment A-402 (Sowmiya)",
      type: "Smart Flow Meter Online",
      status: "Active",
      time: "5 hours ago",
      level: "badge-success",
    },
  ];

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Overview" />

      <main className="comm-main-content">
        {/* TOP HEADER */}
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">PROPERTY GOVERNANCE</span>
            <h1>Admin Dashboard</h1>
            <p>Property infrastructure, resident management, and administrative oversight</p>
          </div>

          <div className="comm-header-right">
            <div className="comm-clock">
              <span>SYSTEM TIME</span>
              <strong>{currentTime.toLocaleTimeString()}</strong>
            </div>
            <div className="comm-user-pill">
              <span className="comm-online-dot-inline"></span>
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <div className="comm-body-content">
          {/* DUAL PORTAL ACCESS SECTION (ONLY IN COMMUNITY ADMIN OVERVIEW) */}
          <section className="comm-portal-gateways-grid">
            <div className="comm-gateway-card admin-portal">
              <div className="comm-gateway-top">
                <div className="comm-gateway-icon">🛡️</div>
                <div>
                  <span className="comm-gateway-tag">SYSTEM ADMINISTRATOR PORTAL</span>
                  <h2>Open Admin Portal</h2>
                </div>
              </div>
              <p>
                Access detailed operations, hardware smart meters, multi-tier tariff rates, service technician dispatches, and deep analytics.
              </p>
              <button
                type="button"
                className="comm-gateway-btn"
                onClick={() => navigate("/admin/dashboard")}
              >
                <span>Launch Admin Portal</span>
                <span>→</span>
              </button>
            </div>
          </section>

          {/* COMMUNITY KPI CARDS */}
          <section className="comm-stats-grid">
            {communityStats.map((stat) => (
              <div key={stat.label} className="comm-stat-card">
                <div
                  className="comm-stat-icon"
                  style={{ background: stat.iconBg, color: stat.iconColor }}
                >
                  {stat.icon}
                </div>
                <div className="comm-stat-info">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <p>{stat.subtext}</p>
                </div>
              </div>
            ))}
          </section>

          {/* COMMUNITY SECTIONS DIRECT ACCESS GRID */}
          <section className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Community Management Modules</h2>
                <p>Direct navigation to dedicated Community Admin sections</p>
              </div>
              <span className="comm-badge badge-info">10 Core Modules</span>
            </div>

            <div className="comm-modules-grid">
              {communityModules.map((mod) => (
                <div
                  key={mod.name}
                  className="comm-module-tile"
                  onClick={() => navigate(mod.path)}
                >
                  <div className="comm-module-tile-icon">{mod.icon}</div>
                  <div className="comm-module-tile-text">
                    <strong>{mod.name}</strong>
                    <span>{mod.desc}</span>
                  </div>
                  <span className="comm-tile-arrow">→</span>
                </div>
              ))}
            </div>
          </section>

          {/* RECENT COMMUNITY INCIDENTS & AUDIT LOG */}
          <section className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Community Live Incidents & Telemetry Audits</h2>
                <p>Real-time updates from 2-Sigma leak engine and hardware flow meters</p>
              </div>
              <button
                type="button"
                className="comm-btn-outline"
                onClick={() => navigate("/community-admin/alerts-notifications")}
              >
                View All Alerts
              </button>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Location / Unit</th>
                    <th>Incident Type</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((inc) => (
                    <tr key={inc.id}>
                      <td><strong>{inc.id}</strong></td>
                      <td>{inc.area}</td>
                      <td>{inc.type}</td>
                      <td>
                        <span className={`comm-badge ${inc.level}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{inc.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CommunityAdminOverview;
