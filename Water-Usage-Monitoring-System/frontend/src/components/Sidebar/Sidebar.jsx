import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import { useLanguage } from "../../context/LanguageContext";
import "./Sidebar.css";

function Sidebar({ activePage = "Overview", onNavigate, onLogout }) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { t } = useLanguage();

  const menuSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "📊",
      items: [
        { name: "Overview", page: "Overview", route: "/user-dashboard", icon: "⌂" },
      ],
    },
    {
      id: "waterManagement",
      title: "Water Management",
      icon: "💧",
      items: [
        { name: "Water Consumption", page: "Water Consumption", route: "/resident/water-consumption", icon: "◉" },
        { name: "Usage History", page: "Usage History", route: "/resident/usage-history", icon: "◷" },
        { name: "Meter Details", page: "Meter Details", route: "/resident/meter-details", icon: "▣" },
        { name: "Consumption Comparison", page: "Consumption Comparison", route: "/resident/consumption-comparison", icon: "⇄" },
        { name: "Water Meter Tips", page: "Water Meter Tips", route: "/resident/meter-tips", icon: "💡" },
      ],
    },
    {
      id: "billing",
      title: "Billing & Payments",
      icon: "💳",
      items: [
        { name: "Current Bill", page: "Current Bill", route: "/resident/current-bill", icon: "₹" },
        { name: "Billing History", page: "Billing History", route: "/resident/billing-history", icon: "▤" },
        { name: "Payment History", page: "Payment History", route: "/resident/payment-history", icon: "✓" },
      ],
    },
    {
      id: "account",
      title: "Account & Settings",
      icon: "👤",
      items: [
        { name: "My Profile", page: "My Profile", route: "/resident/profile", icon: "●" },
        { name: "Account Settings", page: "Account Settings", route: "/resident/settings", icon: "⚙" },
      ],
    },
    {
      id: "support",
      title: "Notifications & Support",
      icon: "🔔",
      items: [
        { name: "Notifications", page: "Notifications", route: "/resident/notifications", icon: "♢" },
      ],
    },
  ];

  // Helper to check which section contains active page
  const getActiveSectionId = () => {
    for (const section of menuSections) {
      if (section.items.some((item) => item.page === activePage || item.name === activePage)) {
        return section.id;
      }
    }
    return "dashboard";
  };

  // State to track open section IDs
  const [openSections, setOpenSections] = useState({
    [getActiveSectionId()]: true,
  });

  const toggleSection = (id) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Mobile drawer (the sidebar is off-canvas below 900px; see AdminSidebar.css)
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleItemClick = (item) => {
    setDrawerOpen(false);
    if (onNavigate) {
      onNavigate(item.page || item.name);
    }
    if (item.route) {
      navigate(item.route);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  // Profile initials helper
  const getInitials = (name) => {
    if (!name) return "SO";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
    <button type="button" className="admin-drawer-toggle" aria-label="Toggle navigation" onClick={() => setDrawerOpen((o) => !o)}>
      ☰
    </button>
    {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
    <aside className={`admin-sidebar resident-black-sidebar ${drawerOpen ? "open" : ""}`}>
      {/* BRAND HEADER */}
      <div className="admin-brand">
        <div className="admin-brand-icon">💧</div>
        <div>
          <h2>AquaMonitor</h2>
          <span>{t("Resident Portal")}</span>
        </div>
      </div>

      {/* USER PROFILE CARD */}
      <div className="admin-profile-card">
        <div className="admin-avatar">{getInitials(profile?.fullName || "Sowmiya")}</div>
        <div className="admin-profile-info">
          <strong>{profile?.fullName || "Sowmiya"}</strong>
          <span>{profile?.apartmentUnit || "Apartment A-402"}</span>
        </div>
        <div className="admin-online-dot" title={t("Resident Account Active")}></div>
      </div>

      {/* NAVIGATION ACCORDION */}
      <nav className="admin-navigation">
        {menuSections.map((section) => {
          const isOpen = !!openSections[section.id];
          const containsActive = section.items.some(
            (item) => item.page === activePage || item.name === activePage
          );

          return (
            <div key={section.id} className="admin-nav-section">
              <button
                type="button"
                className={`admin-section-header ${containsActive ? "contains-active" : ""}`}
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
                    const isActive = item.page === activePage || item.name === activePage;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`admin-nav-item ${isActive ? "active" : ""}`}
                        onClick={() => handleItemClick(item)}
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
        <button type="button" className="admin-logout-button" onClick={handleLogoutClick}>
          🚪 {t("Sign Out")}
        </button>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;