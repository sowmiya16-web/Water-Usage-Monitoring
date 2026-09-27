import React, { useState } from "react";
import PortalTools from "../PortalTools/PortalTools";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import "./CommunityAdminSidebar.css";

function CommunityAdminSidebar({ activePage = "Overview" }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "📊",
      items: [
        { name: "Overview", path: "/community-admin/dashboard", icon: "⌂" },
      ],
    },
    {
      id: "residents",
      title: "Residents",
      icon: "👥",
      items: [
        { name: "Residents", path: "/community-admin/residents", icon: "👥" },
      ],
    },
    {
      id: "households",
      title: "Households",
      icon: "🏠",
      items: [
        { name: "Households", path: "/admin/households", icon: "🏠" },
      ],
    },
    {
      id: "adminManagement",
      title: "Admin Management",
      icon: "🛡️",
      items: [
        { name: "Admin Management", path: "/community-admin/admin-management", icon: "🛡️" },
      ],
    },
    {
      id: "userAccounts",
      title: "User Accounts",
      icon: "📋",
      items: [
        { name: "User Accounts", path: "/community-admin/user-accounts", icon: "📋" },
      ],
    },
    {
      id: "waterMeters",
      title: "Water Meters",
      icon: "📡",
      items: [
        { name: "Water Meters", path: "/community-admin/water-meters", icon: "📡" },
      ],
    },
    {
      id: "consumption",
      title: "Consumption Monitoring",
      icon: "💧",
      items: [
        { name: "Consumption Monitoring", path: "/community-admin/consumption-monitoring", icon: "💧" },
      ],
    },
    {
      id: "billing",
      title: "Billing & Payments",
      icon: "💳",
      items: [
        { name: "Billing & Payments", path: "/community-admin/billing-payments", icon: "💳" },
      ],
    },
    {
      id: "tariff",
      title: "Tariff Management",
      icon: "⚙️",
      items: [
        { name: "Tariff Management", path: "/community-admin/tariff-management", icon: "⚙️" },
      ],
    },
    {
      id: "alerts",
      title: "Alerts & Notifications",
      icon: "🔔",
      items: [
        { name: "Alerts & Notifications", path: "/community-admin/alerts-notifications", icon: "🔔" },
      ],
    },
    {
      id: "reports",
      title: "Reports",
      icon: "📈",
      items: [
        { name: "Reports", path: "/community-admin/reports", icon: "📈" },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      icon: "💻",
      items: [
        { name: "Settings", path: "/community-admin/settings", icon: "💻" },
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
    dashboard: true,
  });

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessType");
    navigate("/login", { replace: true });
  };

  return (
    <>
    <PortalTools />
    <button type="button" className="comm-drawer-toggle" aria-label="Toggle navigation" onClick={() => setDrawerOpen((o) => !o)}>
      ☰
    </button>
    {drawerOpen && <div className="comm-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
    <aside className={`comm-admin-sidebar ${drawerOpen ? "open" : ""}`}>
      {/* BRAND */}
      <div className="comm-admin-brand" onClick={() => navigate("/community-admin/dashboard")}>
        <div className="comm-admin-brand-icon">🏛️</div>
        <div>
          <h2>Aqua Plus</h2>
          <span className="comm-brand-tag">{t("Admin")}</span>
        </div>
      </div>

      {/* ADMIN PROFILE */}
      <div className="comm-admin-profile-card">
        <div className="comm-admin-avatar">AD</div>
        <div className="comm-admin-profile-info">
          <strong>{t("Admin")}</strong>
          <span className="comm-badge-role">{t("Property & Unit Admin")}</span>
        </div>
        <div className="comm-online-dot" title="Admin Active"></div>
      </div>

      {/* NAVIGATION ACCORDION */}
      <nav className="comm-admin-navigation">
        {menuSections.map((section) => {
          const isOpen = !!openSections[section.id];
          const hasActiveItem = section.items.some((item) => item.name === activePage);

          return (
            <div key={section.id} className="comm-nav-section">
              <button
                type="button"
                className={`comm-section-header ${hasActiveItem ? "contains-active" : ""}`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="comm-section-title">
                  <span className="comm-section-icon">{section.icon}</span>
                  <span>{t(section.title)}</span>
                </div>
                <span className={`comm-chevron ${isOpen ? "open" : ""}`}>›</span>
              </button>

              {isOpen && (
                <div className="comm-submenu">
                  {section.items.map((item) => {
                    const isActive = activePage === item.name;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        className={`comm-nav-item ${isActive ? "active" : ""}`}
                        onClick={() => handleNavigate(item.path)}
                      >
                        <span className="comm-item-icon">{item.icon}</span>
                        <span className="comm-item-name">{t(item.name)}</span>
                        {isActive && <span className="comm-active-indicator" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="comm-sidebar-footer">
        <button type="button" className="comm-logout-btn" onClick={handleLogout}>
          <span className="comm-logout-icon">🚪</span>
          <span>{t("Logout System")}</span>
        </button>
      </div>
    </aside>
    </>
  );
}

export default CommunityAdminSidebar;
