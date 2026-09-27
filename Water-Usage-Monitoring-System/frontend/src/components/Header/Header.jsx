import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import "./Header.css";

function Header({ activePage = "Overview", categoryLabel }) {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // An admin who entered through the "Resident Portal" header button is previewing, not signed in as a resident.
  const role = localStorage.getItem("userRole");
  let previewing = false;
  try {
    previewing = sessionStorage.getItem("residentPreview") === "1";
  } catch {
    previewing = false;
  }
  previewing = previewing && (role === "admin" || role === "community_admin");
  const backToAdmin = () => {
    try {
      sessionStorage.removeItem("residentPreview");
    } catch {
      /* ignore */
    }
    navigate(role === "community_admin" ? "/community-admin/dashboard" : "/admin/dashboard");
  };

  // Helper to dynamically set section category heading
  const getCategory = () => {
    if (categoryLabel) return categoryLabel;

    if (["Water Consumption", "Usage History", "Meter Details", "Consumption Comparison", "Water Meter Tips"].includes(activePage)) {
      return "WATER MANAGEMENT";
    }
    if (["Current Bill", "Billing History", "Payment History"].includes(activePage)) {
      return "BILLING & PAYMENTS";
    }
    if (["My Profile", "Account Settings"].includes(activePage)) {
      return "ACCOUNT & SETTINGS";
    }
    if (["Notifications", "Alerts", "Help & Support"].includes(activePage)) {
      return "COMMUNICATION & SUPPORT";
    }
    return "RESIDENT PORTAL";
  };

  return (
    <>
    {previewing && (
      <div className="preview-pill notranslate" translate="no" role="status">
        <span>👁 Previewing the Resident Portal as an admin</span>
        <button type="button" onClick={backToAdmin}>
          Back to admin portal
        </button>
      </div>
    )}
    <header className="dashboard-header">
      {/* 1. LEFT SECTION: WATER MANAGEMENT & PAGE HEADING */}
      <div className="nav-left">
        <div className="header-title-box">
          <span className="header-label">{t(getCategory())}</span>
          <h1 className="header-title-heading">{t(activePage)}</h1>
        </div>
      </div>

      {/* 2. RIGHT SECTION: LANGUAGE SELECTOR & TAMIL APARTMENT BRAND CARD */}
      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <LanguageSelector variant="header-variant" />
        <div className="tamil-apartment-card" title="Tamil Apartment Community">
          <div className="ta-badge">TA</div>
          <div className="ta-info">
            <strong>{t("Apartment")}</strong>
            <span>{profile?.apartment || "Apartment A-402"}</span>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}

export default Header;