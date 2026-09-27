import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./UserAccounts.css";

function UserAccounts() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([
    {
      id: "USR-1001",
      name: "Sowmiya",
      email: "Sowmiya@gmail.com",
      role: "Resident",
      apartment: "Apartment A-402",
      status: "Active",
      lastLogin: "10 mins ago",
      created: "12 Jan 2024",
    },
    {
      id: "USR-1002",
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      role: "Resident",
      apartment: "Apartment A-101",
      status: "Active",
      lastLogin: "Today, 08:16 AM",
      created: "18 Feb 2024",
    },
    {
      id: "USR-1003",
      name: "Priya Sundaram",
      email: "priya.s@example.com",
      role: "Resident",
      apartment: "Apartment B-203",
      status: "Active",
      lastLogin: "35 mins ago",
      created: "05 Mar 2024",
    },
    {
      id: "USR-1004",
      name: "Admin System",
      email: "admin@watermonitor.com",
      role: "System Administrator",
      apartment: "Admin HQ",
      status: "Active",
      lastLogin: "Active Now",
      created: "01 Jan 2024",
    },
  ]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.apartment.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "All" || a.role.toLowerCase().includes(roleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [accounts, search, roleFilter]);

  const toggleAccountStatus = (id) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === "Active" ? "Suspended" : "Active" } : a
      )
    );
  };

  return (
    <div className="accounts-page">
      <AdminSidebar activePage="User Accounts" />

      <main className="accounts-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">USER MANAGEMENT</span>
            <h1>System User Accounts</h1>
          </div>
        </header>

        <div className="accounts-content">
          <section className="residents-filters-card">
            <div className="search-input-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search user accounts by name, email, or unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-select-group">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">All User Roles</option>
                <option value="Resident">Resident</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </section>

          <section className="residents-table-card">
            <div className="table-header-title">
              <h3>System Credentials & Access Directory ({filteredAccounts.length})</h3>
            </div>

            <table className="residents-table">
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Access Role</th>
                  <th>Assigned Unit</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-id">{a.id}</td>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.email}</td>
                    <td>
                      <span className="badge-sev info">{a.role}</span>
                    </td>
                    <td>{a.apartment}</td>
                    <td className="text-sub">{a.lastLogin}</td>
                    <td>
                      <span className={`status-badge ${a.status.toLowerCase()}`}>
                        ● {a.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className={`btn-tbl-status ${a.status === "Active" ? "deactivate" : "activate"}`}
                        onClick={() => toggleAccountStatus(a.id)}
                      >
                        {a.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}

export default UserAccounts;