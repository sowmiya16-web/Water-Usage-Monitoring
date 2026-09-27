import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./AdminProfile.css";

function AdminProfile() {
  const navigate = useNavigate();

  const [adminProfile, setAdminProfile] = useState({
    initials: "AD",
    name: "System Administrator",
    email: "admin@watermonitor.com",
    phone: "+91 98765 00001",
    role: "Super System Admin",
    department: "Water Infrastructure & Utility Operations",
    adminSince: "January 2024",
    lastLogin: "Just now",
    accountStatus: "Active",
    accessLevel: "Full System & Security Access",
  });

  const [noticeMessage, setNoticeMessage] = useState("");

  const handleUpdateProfile = () => {
    setNoticeMessage("✓ Admin system profile details updated successfully.");
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Admin Profile" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">SYSTEM MANAGEMENT</span>
            <h1>Administrator System Profile</h1>
          </div>
        </header>

        <div className="reports-content-container">
          {noticeMessage && <div className="notice-alert-banner">{noticeMessage}</div>}

          {/* ADMIN PROFILE HERO CARD */}
          <section className="admin-prof-hero">
            <div className="prof-avatar-large">{adminProfile.initials}</div>
            <div className="prof-hero-details">
              <h2>{adminProfile.name}</h2>
              <p className="text-sub">{adminProfile.role} • {adminProfile.department}</p>
              <span className="badge-status success">{adminProfile.accountStatus} System Credentials</span>
            </div>
          </section>

          {/* PROFILE SECTIONS GRID */}
          <section className="admin-prof-sections-grid">
            <div className="prof-section-card">
              <h3>Personal Credentials</h3>
              <div className="prof-field-group">
                <label>FULL NAME</label>
                <input
                  type="text"
                  value={adminProfile.name}
                  onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                />
              </div>

              <div className="prof-field-group">
                <label>PRIMARY EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                />
              </div>

              <div className="prof-field-group">
                <label>CONTACT PHONE NUMBER</label>
                <input
                  type="text"
                  value={adminProfile.phone}
                  onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="prof-section-card">
              <h3>System Role & Access Security</h3>
              <div className="prof-info-row">
                <span>ADMINISTRATIVE ROLE</span>
                <strong>{adminProfile.role}</strong>
              </div>

              <div className="prof-info-row">
                <span>DEPARTMENT</span>
                <strong>{adminProfile.department}</strong>
              </div>

              <div className="prof-info-row">
                <span>SYSTEM ACCESS PRIVILEGE</span>
                <strong>{adminProfile.accessLevel}</strong>
              </div>

              <div className="prof-info-row">
                <span>ADMINISTRATOR SINCE</span>
                <strong>{adminProfile.adminSince}</strong>
              </div>

              <div className="prof-info-row">
                <span>LAST SECURITY LOGIN</span>
                <strong>{adminProfile.lastLogin}</strong>
              </div>
            </div>
          </section>

          <div className="prof-save-bar">
            <button type="button" className="btn-primary-pay" onClick={handleUpdateProfile}>
              💾 Save Profile Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminProfile;
