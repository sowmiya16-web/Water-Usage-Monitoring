import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import residentService from "../../../services/residentService";
import "./Residents.css";

const INITIAL_RESIDENTS = [
  {
    id: "USR-2026-001",
    name: "Sowmiya",
    email: "sowmiya@gmail.com",
    phone: "+91 98765 43210",
    apartment: "Apartment A-402",
    meterId: "WM-A101-2026",
    consumption: "18.6 KL",
    billingStatus: "Paid",
    paymentStatus: "Up to Date",
    outstandingAmount: 0.0,
    status: "Active",
    registrationDate: "12 Jan 2024",
    lastLogin: "30 Aug 2026, 03:42 PM",
    recentActivity: "Paid August Water Bill via UPI GPay (₹837.00)",
  },
  {
    id: "USR-2026-002",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98765 12345",
    apartment: "Apartment A-101",
    meterId: "WM-A101-8821",
    consumption: "21.3 KL",
    billingStatus: "Paid",
    paymentStatus: "Up to Date",
    outstandingAmount: 0.0,
    status: "Active",
    registrationDate: "18 Feb 2024",
    lastLogin: "30 Aug 2026, 02:15 PM",
    recentActivity: "Viewed Usage History Analytics",
  },
  {
    id: "USR-2026-003",
    name: "Priya Sundaram",
    email: "priya.s@example.com",
    phone: "+91 99887 66554",
    apartment: "Apartment B-203",
    meterId: "WM-B203-9912",
    consumption: "26.4 KL",
    billingStatus: "Pending",
    paymentStatus: "Payment Due",
    outstandingAmount: 1188.0,
    status: "Active",
    registrationDate: "05 Mar 2024",
    lastLogin: "30 Aug 2026, 11:30 AM",
    recentActivity: "Logged high-consumption support ticket",
  },
  {
    id: "USR-2026-004",
    name: "Arun Varma",
    email: "arun.v@example.com",
    phone: "+91 97654 32109",
    apartment: "Apartment B-304",
    meterId: "WM-B304-4412",
    consumption: "14.2 KL",
    billingStatus: "Paid",
    paymentStatus: "Up to Date",
    outstandingAmount: 0.0,
    status: "Active",
    registrationDate: "21 Apr 2024",
    lastLogin: "29 Aug 2026, 06:10 PM",
    recentActivity: "Downloaded July Bill Receipt",
  },
  {
    id: "USR-2026-005",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    phone: "+91 96543 21098",
    apartment: "Apartment C-501",
    meterId: "WM-C501-1190",
    consumption: "32.8 KL",
    billingStatus: "Overdue",
    paymentStatus: "Past Due Date",
    outstandingAmount: 1476.0,
    status: "Inactive",
    registrationDate: "16 Jun 2024",
    lastLogin: "15 Aug 2026, 09:00 AM",
    recentActivity: "Account marked inactive by admin",
  },
];

function Residents() {
  const navigate = useNavigate();

  const [residents, setResidents] = useState(INITIAL_RESIDENTS);
  const [loadingResidents, setLoadingResidents] = useState(true);

  // Load live residents from MySQL via Spring Boot on mount
  useEffect(() => {
    setLoadingResidents(true);
    residentService.getAllResidents()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((r) => ({
            id: `USR-${r.residentId}`,
            name: r.fullName || "-",
            email: r.email || "-",
            phone: r.phone || "-",
            apartment: r.apartmentNumber ? `Apartment ${r.apartmentNumber}` : "-",
            meterId: r.meterNumber || r.waterMeterId || "-",
            consumption: "-",
            billingStatus: "-",
            paymentStatus: "-",
            outstandingAmount: 0.0,
            status: "Active",
            registrationDate: "-",
            lastLogin: "-",
            recentActivity: `Registered in ${r.buildingName || "-"}`,
          }));
          setResidents(mapped);
          localStorage.setItem("system_residents", JSON.stringify(mapped));
        } else {
          const stored = localStorage.getItem("system_residents");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) setResidents(parsed);
            } catch (_) {}
          }
        }
      })
      .catch(() => {
        const stored = localStorage.getItem("system_residents");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) setResidents(parsed);
          } catch (_) {}
        }
      })
      .finally(() => setLoadingResidents(false));
  }, []);


  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");

  const filteredUsers = useMemo(() => {
    return residents.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.apartment.toLowerCase().includes(q) ||
        r.meterId.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [residents, search, statusFilter]);

  const handleToggleStatus = (id) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === "Active" ? "Inactive" : "Active";
          setNoticeMessage(`✓ Account #${id} (${r.name}) status updated to ${nextStatus}.`);
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  const handleSaveEditUser = (e) => {
    e.preventDefault();
    setResidents((prev) =>
      prev.map((r) => (r.id === editUserModal.id ? editUserModal : r))
    );
    setNoticeMessage(`✓ User Account #${editUserModal.id} credentials updated successfully.`);
    setEditUserModal(null);
    setTimeout(() => setNoticeMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Contact Phone",
      "Apartment Unit",
      "Meter Number",
      "Current Consumption",
      "Billing Status",
      "Payment Status",
      "Outstanding Amount (INR)",
      "Account Status",
      "Registration Date",
      "Last Login",
      "Recent Activity",
    ];

    const rows = filteredUsers.map((r) => [
      r.id,
      r.name,
      r.email,
      r.phone,
      r.apartment,
      r.meterId,
      r.consumption,
      r.billingStatus,
      r.paymentStatus,
      `₹${r.outstandingAmount.toFixed(2)}`,
      r.status,
      r.registrationDate,
      r.lastLogin,
      r.recentActivity,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Registered_Users_Directory.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Residents" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">USER MANAGEMENT</span>
            <h1>Registered Users Account Directory</h1>
          </div>
          <div className="admin-header-right" style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => navigate("/admin/add-resident")}
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#fff",
                border: "none",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ➕ Add Resident
            </button>
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              👥 Export Users CSV
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {noticeMessage && <div className="notice-alert-banner">{noticeMessage}</div>}

          {/* KPI CARDS & ADD RESIDENT BOX */}
          <section className="reports-kpi-grid">
            <div
              className="report-kpi-card"
              style={{
                cursor: "pointer",
                border: "1px stroke rgba(56, 189, 248, 0.4)",
                background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%)",
              }}
              onClick={() => navigate("/admin/add-resident")}
            >
              <span>ONBOARDING ACTION</span>
              <strong style={{ color: "#38bdf8", fontSize: "1.2rem", marginTop: "4px" }}>➕ Add New Resident</strong>
              <small style={{ color: "#7dd3fc" }}>Click to open onboarding form</small>
            </div>
            <div className="report-kpi-card">
              <span>TOTAL REGISTERED USERS</span>
              <strong>142 <small>Households</small></strong>
              <small>Society Residents Directory</small>
            </div>

            <div className="report-kpi-card highlight">
              <span>ACTIVE USER ACCOUNTS</span>
              <strong className="text-success">138 <small>Active</small></strong>
              <small>97.1% Active Ratio</small>
            </div>

            <div className="report-kpi-card">
              <span>INACTIVE / VACANT UNITS</span>
              <strong>4 <small>Accounts</small></strong>
              <small>Action / Onboarding Needed</small>
            </div>

            <div className="report-kpi-card">
              <span>TOTAL OUTSTANDING BALANCE</span>
              <strong className="text-warning">₹22,200</strong>
              <small>20 Pending Accounts</small>
            </div>
          </section>

          {/* TABLE & CONTROLS */}
          <section className="reports-table-card">
            <div className="table-controls-row">
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search user ID, name, email, unit, or meter number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-selects">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Account Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Resident & Unit</th>
                    <th>Email & Contact</th>
                    <th>Meter Number</th>
                    <th>Consumption</th>
                    <th>Billing Status</th>
                    <th>Outstanding (₹)</th>
                    <th>Last Login</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((r) => (
                      <tr key={r.id}>
                        <td className="font-id">{r.id}</td>
                        <td>
                          <strong>{r.name}</strong>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>{r.apartment}</p>
                        </td>
                        <td>
                          <span className="text-sub">{r.email}</span>
                          <p className="text-sub" style={{ margin: "2px 0 0" }}>{r.phone}</p>
                        </td>
                        <td><span className="charge-cat usage">{r.meterId}</span></td>
                        <td><strong>{r.consumption}</strong></td>
                        <td>
                          <span className={`badge-status ${r.billingStatus.toLowerCase()}`}>
                            {r.billingStatus}
                          </span>
                        </td>
                        <td><strong className={r.outstandingAmount > 0 ? "text-danger" : "text-price"}>₹{r.outstandingAmount.toFixed(2)}</strong></td>
                        <td className="text-sub">{r.lastLogin}</td>
                        <td>
                          <span className={`badge-status ${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button type="button" className="btn-tbl-view" onClick={() => setSelectedUser(r)}>
                              Profile
                            </button>
                            <button type="button" className="btn-tbl-action" onClick={() => setEditUserModal(r)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className={`btn-tbl-action ${r.status === "Active" ? "btn-danger-act" : ""}`}
                              onClick={() => handleToggleStatus(r.id)}
                            >
                              {r.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="empty-table-msg">
                        No registered users found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* VIEW USER PROFILE AUDIT MODAL */}
          {selectedUser && (
            <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
              <div className="modal-box req-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span className="modal-sub">USER ACCOUNT & TELEMETRY AUDIT</span>
                    <h3>Account #{selectedUser.id}</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setSelectedUser(null)}>×</button>
                </div>

                <div className="modal-body">
                  <div className="b-hero-card">
                    <div>
                      <span>FULL NAME</span>
                      <strong>{selectedUser.name}</strong>
                      <p>{selectedUser.apartment} • Email: {selectedUser.email}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>ACCOUNT STATUS</span>
                      <span className={`badge-status ${selectedUser.status.toLowerCase()}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>

                  <div className="b-grid">
                    <div className="b-box">
                      <span>Contact Phone Number</span>
                      <strong>{selectedUser.phone}</strong>
                    </div>
                    <div className="b-box">
                      <span>Assigned Smart Meter</span>
                      <strong>{selectedUser.meterId}</strong>
                    </div>
                    <div className="b-box">
                      <span>Current Month Consumption</span>
                      <strong>{selectedUser.consumption}</strong>
                    </div>
                    <div className="b-box">
                      <span>Billing & Payment Status</span>
                      <strong>{selectedUser.billingStatus} ({selectedUser.paymentStatus})</strong>
                    </div>
                    <div className="b-box">
                      <span>Outstanding Balance</span>
                      <strong className={selectedUser.outstandingAmount > 0 ? "text-danger" : "text-price"}>
                        ₹{selectedUser.outstandingAmount.toFixed(2)}
                      </strong>
                    </div>
                    <div className="b-box">
                      <span>Registration Date</span>
                      <strong>{selectedUser.registrationDate}</strong>
                    </div>
                    <div className="b-box">
                      <span>Last Portal Login</span>
                      <strong>{selectedUser.lastLogin}</strong>
                    </div>
                    <div className="b-box" style={{ gridColumn: "span 2" }}>
                      <span>Recent User Activity</span>
                      <strong>{selectedUser.recentActivity}</strong>
                    </div>
                  </div>

                  <div className="modal-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary-action"
                      onClick={() => {
                        setEditUserModal(selectedUser);
                        setSelectedUser(null);
                      }}
                    >
                      ✏️ Edit User Details
                    </button>
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedUser(null)}
                    >
                      Close Profile Audit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT USER MODAL */}
          {editUserModal && (
            <div className="modal-backdrop" onClick={() => setEditUserModal(null)}>
              <div className="modal-box req-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span className="modal-sub">EDIT RESIDENT ACCOUNT</span>
                    <h3>User #{editUserModal.id}</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setEditUserModal(null)}>×</button>
                </div>

                <form onSubmit={handleSaveEditUser} className="modal-body">
                  <div className="prof-field-group">
                    <label>FULL NAME</label>
                    <input
                      type="text"
                      value={editUserModal.name}
                      onChange={(e) => setEditUserModal({ ...editUserModal, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="prof-field-group">
                    <label>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={editUserModal.email}
                      onChange={(e) => setEditUserModal({ ...editUserModal, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="prof-field-group">
                    <label>PHONE NUMBER</label>
                    <input
                      type="text"
                      value={editUserModal.phone}
                      onChange={(e) => setEditUserModal({ ...editUserModal, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="prof-field-group">
                    <label>APARTMENT / UNIT</label>
                    <input
                      type="text"
                      value={editUserModal.apartment}
                      onChange={(e) => setEditUserModal({ ...editUserModal, apartment: e.target.value })}
                      required
                    />
                  </div>

                  <div className="modal-actions-bar">
                    <button type="button" className="btn-secondary-action" onClick={() => setEditUserModal(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary-pay">
                      💾 Save Account Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Residents;