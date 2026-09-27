import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityResidents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [residents, setResidents] = useState([
    {
      id: "RES-101",
      name: "Sowmiya",
      flat: "A-402",
      block: "Tower A",
      meterNo: "WM-A402-09",
      contact: "+91 98765 43210",
      avgDailyUsage: "340 L",
      billStatus: "Paid",
      status: "Active",
    },
    {
      id: "RES-102",
      name: "Arun Kumar",
      flat: "B-104",
      block: "Tower B",
      meterNo: "WM-B104-12",
      contact: "+91 98765 11223",
      avgDailyUsage: "420 L",
      billStatus: "Paid",
      status: "Active",
    },
    {
      id: "RES-103",
      name: "Priya Sundaram",
      flat: "B-203",
      block: "Tower B",
      meterNo: "WM-B203-88",
      contact: "+91 99887 66554",
      avgDailyUsage: "610 L",
      billStatus: "Pending",
      status: "Active",
    },
    {
      id: "RES-104",
      name: "Vikram Rathore",
      flat: "C-305",
      block: "Tower C",
      meterNo: "WM-C305-41",
      contact: "+91 94432 77889",
      avgDailyUsage: "290 L",
      billStatus: "Paid",
      status: "Active",
    },
    {
      id: "RES-105",
      name: "Meenakshi Devi",
      flat: "A-102",
      block: "Tower A",
      meterNo: "WM-A102-17",
      contact: "+91 91234 56780",
      avgDailyUsage: "380 L",
      billStatus: "Overdue",
      status: "Active",
    },
  ]);

  const filteredResidents = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.flat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.meterNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.billStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Residents" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">COMMUNITY DIRECTORY</span>
            <h1>Residents</h1>
            <p>Supervise township households, unit allocations, and occupancy telemetry</p>
          </div>
          <div className="comm-header-right">
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => alert("Add Resident dialog opened.")}
            >
              + Register New Resident
            </button>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>👥</div>
              <div className="comm-stat-info">
                <span>Total Households</span>
                <strong>142 Units</strong>
                <p>97.2% Occupancy Rate</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>✓</div>
              <div className="comm-stat-info">
                <span>Active Accounts</span>
                <strong>138 Units</strong>
                <p>Verified Profiles</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>🏠</div>
              <div className="comm-stat-info">
                <span>Vacant Units</span>
                <strong>4 Units</strong>
                <p>Valves Securely Isolated</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>📡</div>
              <div className="comm-stat-info">
                <span>Meter Linked</span>
                <strong>142 Units</strong>
                <p>100% Smart Node Linked</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-toolbar">
              <div className="comm-search-input">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search resident name, flat number, meter ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="comm-filter-group">
                <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#64748b" }}>Billing Filter:</label>
                <select
                  className="comm-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Resident ID</th>
                    <th>Resident Name</th>
                    <th>Apartment Unit</th>
                    <th>Smart Meter No</th>
                    <th>Contact Phone</th>
                    <th>Daily Avg Usage</th>
                    <th>Billing Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.id}</strong></td>
                      <td>
                        <strong>{r.name}</strong>
                      </td>
                      <td>
                        <span className="comm-badge badge-info">{r.flat}</span> ({r.block})
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums", color: "#0284c7" }}>{r.meterNo}</td>
                      <td>{r.contact}</td>
                      <td><strong>{r.avgDailyUsage}</strong></td>
                      <td>
                        <span
                          className={`comm-badge ${
                            r.billStatus === "Paid"
                              ? "badge-success"
                              : r.billStatus === "Pending"
                              ? "badge-warning"
                              : "badge-danger"
                          }`}
                        >
                          {r.billStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                          onClick={() => alert(`Viewing details for resident ${r.name} (${r.flat})`)}
                        >
                          View Details
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

export default CommunityResidents;
