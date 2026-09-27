import { useNavigate } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import "./Myprofile.css";

function MyProfile() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const personalFields = [
    { label: "FULL NAME", value: profile.name },
    { label: "EMAIL ADDRESS", value: profile.email },
    { label: "PHONE NUMBER", value: profile.phone },
  ];

  const residentFields = [
    { label: "APARTMENT", value: profile.apartment },
    { label: "BUILDING", value: profile.building || "Block A" },
    { label: "FLOOR", value: profile.floor || "4th Floor" },
    { label: "METER NUMBER", value: profile.meterId || "WM-A101-2026" },
  ];

  const accountFields = [
    { label: "ACCOUNT TYPE", value: profile.accountType || "Resident Household" },
    { label: "RESIDENT SINCE", value: profile.residentSince || "January 2024" },
    { label: "ACCOUNT STATUS", value: profile.accountStatus || "Active", status: true },
    { label: "MONTHLY QUOTA", value: profile.quota || "25.0 KL / month" },
  ];

  return (
    <div className="profile-page">
      <Sidebar activePage="My Profile" onLogout={handleLogout} />

      <main className="profile-main">
        <Header activePage="My Profile" />

        <div className="profile-content">
          {/* PAGE HEADING */}
          <div className="profile-heading">
            <div>
              <span className="section-label">ACCOUNT</span>
              <h2>My Profile</h2>
              <p>Your personal information, resident details, and account overview.</p>
            </div>

            <button
              type="button"
              className="settings-link-button"
              onClick={() => navigate("/resident/settings")}
            >
              Account Settings →
            </button>
          </div>

          {/* PROFILE CARD */}
          <section className="profile-card">
            <div className="profile-avatar-row">
              <div className="large-avatar">{profile.initials}</div>

              <div className="profile-avatar-info">
                <h3>{profile.name}</h3>
                <p>{profile.apartment} · {profile.building || "Block A"}</p>
                <span className="profile-status-badge">
                  ● {profile.accountStatus || "Active"} Account
                </span>
              </div>
            </div>
          </section>

          {/* DETAILS GRID */}
          <div className="profile-details-grid">
            {/* PERSONAL INFORMATION */}
            <section className="profile-section">
              <div className="section-title">Personal Information</div>
              <div className="fields-list">
                {personalFields.map((field) => (
                  <div key={field.label} className="field-row">
                    <span className="field-label">{field.label}</span>
                    <strong className="field-value">{field.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            {/* RESIDENT DETAILS */}
            <section className="profile-section">
              <div className="section-title">Resident Details</div>
              <div className="fields-list">
                {residentFields.map((field) => (
                  <div key={field.label} className="field-row">
                    <span className="field-label">{field.label}</span>
                    <strong className="field-value">{field.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            {/* ACCOUNT OVERVIEW */}
            <section className="profile-section">
              <div className="section-title">Account Overview</div>
              <div className="fields-list">
                {accountFields.map((field) => (
                  <div key={field.label} className="field-row">
                    <span className="field-label">{field.label}</span>
                    <strong className={`field-value ${field.status ? "status-active" : ""}`}>
                      {field.value}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyProfile;