import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
// Shared admin shell styles (.admin-header, .admin-badge, .admin-content, ...) are defined in the
// dashboard stylesheet and reused by most Admin pages, so load them with the sidebar on every page.
import "../../pages/Admin/Dashboard/Overview.css";
import PortalTools from "../PortalTools/PortalTools";
import "./AdminSidebar.css";

function AdminSidebar({ activePage }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "📊",
      items: [
        { name: "Overview", path: "/admin/dashboard", icon: "⌂" },
      ],
    },
    {
      id: "userManagement",
      title: "User Management",
      icon: "👥",
      items: [
        { name: "Residents", path: "/admin/residents", icon: "♙" },
        { name: "Add Resident", path: "/admin/add-resident", icon: "➕" },
        { name: "User Accounts", path: "/admin/user-accounts", icon: "▣" },
      ],
    },
    {
      id: "documentVerification",
      title: "Document Verification",
      icon: "🗂️",
      items: [
        { name: "Document Verification", path: "/admin/documents", icon: "📄" },
      ],
    },
    {
      id: "waterManagement",
      title: "Water Management",
      icon: "💧",
      items: [
        { name: "Water Meters", path: "/admin/water-management/water-meters", icon: "📡" },
        { name: "Add Water Meter", path: "/admin/add-water-meter", icon: "🔌" },
        { name: "Households", path: "/admin/households", icon: "🏠" },
        { name: "Household Comparison", path: "/admin/household-comparison", icon: "🏘️" },
        { name: "Meter Readings", path: "/admin/meter-readings", icon: "🧾" },
      ],
    },
    {
      id: "billing",
      title: "Billing & Payments",
      icon: "💳",
      items: [
        { name: "Billing Management", path: "/admin/billing-management", icon: "📄" },
        { name: "Payment Management", path: "/admin/payment-management", icon: "💳" },
        { name: "Tariff Management", path: "/admin/tariff-management", icon: "⚙️" },
        { name: "Tariff Versions", path: "/admin/tariff-versions", icon: "🕘" },
        { name: "Billing Cycles", path: "/admin/billing-cycles", icon: "🗓️" },
        { name: "Bulk Water Purchases", path: "/admin/bulk-purchases", icon: "🚚" },
        { name: "Traffic Analytics", path: "/admin/traffic-management", icon: "🚦" },
      ],
    },
    {
      id: "operations",
      title: "Operations",
      icon: "⚙️",
      items: [
        { name: "Meter Monitoring", path: "/admin/meter-monitoring", icon: "📶" },
        { name: "Alerts & Notifications", path: "/admin/alerts-notifications", icon: "🔔" },
      ],
    },
    {
      id: "serviceMaintenance",
      title: "Service & Maintenance",
      icon: "🛠️",
      items: [
        { name: "Service Requests", path: "/admin/service-requests", icon: "🛠️" },
        { name: "Maintenance Management", path: "/admin/maintenance-management", icon: "🔧" },
        { name: "Issue & Resolution Tracking", path: "/admin/issue-tracking", icon: "📋" },
      ],
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      icon: "📈",
      items: [
        { name: "Consumption Reports", path: "/admin/consumption-reports", icon: "📉" },
        { name: "Billing Reports", path: "/admin/billing-reports", icon: "📑" },
        { name: "Revenue Reports", path: "/admin/revenue-reports", icon: "💵" },
      ],
    },
    {
      id: "system",
      title: "System",
      icon: "💻",
      items: [
        { name: "Admin Profile", path: "/admin/profile", icon: "👤" },
      ],
    },
  ];

  // Helper to check which section contains active page
  const getActiveSectionId = () => {
    for (const section of menuSections) {
      if (section.items.some((item) => item.name === activePage)) {
        return section.id;
      }
    }
    return "dashboard";
  };

  const [openSections, setOpenSections] = useState({
    [getActiveSectionId()]: true,
  });

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const accountEmail = localStorage.getItem("userEmail");

  const handleNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    ["isAuthenticated", "userRole", "accessType", "userEmail", "authToken"].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  return (
    <>
    <PortalTools />
    <button type="button" className="admin-drawer-toggle" aria-label="Toggle navigation" onClick={() => setDrawerOpen((o) => !o)}>
      ☰
    </button>
    {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
    <aside className={`admin-sidebar ${drawerOpen ? "open" : ""}`}>
      {/* BRAND */}
      <div className="admin-brand">
        <div className="admin-brand-icon">💧</div>
        <div>
          <h2>WaterFlow</h2>
          <span>{t("Community Admin Portal")}</span>
        </div>
      </div>

      {/* COMMUNITY ADMIN PROFILE */}
      <div className="admin-profile-card">
        <div className="admin-avatar">
          CA
        </div>
        <div className="admin-profile-info">
          <strong>{t("Community Admin")}</strong>
          <span title={accountEmail || ""}>{accountEmail || t("Community Manager")}</span>
        </div>
        <div className="admin-online-dot" title="Active"></div>
      </div>

      {/* NAVIGATION ACCORDION */}
      <nav className="admin-navigation">
        {menuSections.map((section) => {
          const isOpen = !!openSections[section.id];
          const hasActiveItem = section.items.some((item) => item.name === activePage);

          return (
            <div key={section.id} className="admin-nav-section">
              <button
                type="button"
                className={`admin-section-header ${hasActiveItem ? "contains-active" : ""}`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="header-title">
                  <span className="section-icon">{section.icon}</span>
                  <span className="admin-section-title">{t(section.title)}</span>
                </div>
                <span className={`chevron ${isOpen ? "open" : ""}`}>›</span>
              </button>

              {isOpen && (
                <div className="admin-section-items">
                  {section.items.map((item) => {
                    const isActive = activePage === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`admin-nav-item ${isActive ? "active" : ""}`}
                        onClick={() => handleNavigate(item.path)}
                      >
                        <span className="admin-nav-icon">{item.icon}</span>
                        <span>{t(item.name)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* FOOTER LOGOUT */}
      <div className="admin-sidebar-footer">
        <button type="button" className="admin-logout-button" onClick={handleLogout}>
          <span>➔</span> {t("Logout System")}
        </button>
      </div>
    </aside>
    </>
  );
}

export default AdminSidebar;