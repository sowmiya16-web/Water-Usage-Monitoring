import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./BillingReports.css";

const BILLING_DATA = [
  { month: "August 2026", billed: 124500, collected: 102300, pending: 18500, overdue: 3700, rate: 82.1 },
  { month: "July 2026", billed: 120000, collected: 116000, pending: 2500, overdue: 1500, rate: 96.6 },
  { month: "June 2026", billed: 122000, collected: 118000, pending: 3000, overdue: 1000, rate: 96.7 },
  { month: "May 2026", billed: 118000, collected: 115000, pending: 2000, overdue: 1000, rate: 97.4 },
  { month: "April 2026", billed: 112000, collected: 110000, pending: 1500, overdue: 500, rate: 98.2 },
  { month: "March 2026", billed: 105000, collected: 102000, pending: 2000, overdue: 1000, rate: 97.1 },
];

function BillingReports() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return BILLING_DATA.filter((b) => b.month.toLowerCase().includes(q));
  }, [search]);

  const totals = {
    billed: BILLING_DATA.reduce((s, b) => s + b.billed, 0),
    collected: BILLING_DATA.reduce((s, b) => s + b.collected, 0),
    pending: BILLING_DATA.reduce((s, b) => s + b.pending, 0),
    overdue: BILLING_DATA.reduce((s, b) => s + b.overdue, 0),
  };

  const handleExportCSV = () => {
    const headers = ["Billing Period", "Billed Amount (INR)", "Collected Amount (INR)", "Pending (INR)", "Overdue (INR)", "Collection Rate (%)"];
    const rows = filtered.map((b) => [b.month, `₹${b.billed}`, `₹${b.collected}`, `₹${b.pending}`, `₹${b.overdue}`, `${b.rate}%`]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Billing_Reports_2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Billing Reports" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">REPORTS & ANALYTICS</span>
            <h1>Financial Billing Reports</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              📑 Export Billing CSV
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {/* KPI GRID */}
          <section className="reports-kpi-grid">
            <div className="report-kpi-card">
              <span>TOTAL HISTORICAL BILLED</span>
              <strong>₹{(totals.billed / 1000).toFixed(1)}k</strong>
              <small>Last 6 Months Cumulative</small>
            </div>

            <div className="report-kpi-card highlight">
              <span>TOTAL COLLECTED REVENUE</span>
              <strong className="text-success">₹{(totals.collected / 1000).toFixed(1)}k</strong>
              <small>Settled Invoices</small>
            </div>

            <div className="report-kpi-card">
              <span>TOTAL OVERDUE</span>
              <strong className="text-danger">₹{(totals.overdue / 1000).toFixed(1)}k</strong>
              <small>Action Required</small>
            </div>

            <div className="report-kpi-card">
              <span>AVG COLLECTION RATE</span>
              <strong>{((totals.collected / totals.billed) * 100).toFixed(1)}%</strong>
              <small>6-Month Average</small>
            </div>
          </section>

          {/* FINANCIAL TREND CHART */}
          <section className="reports-chart-card">
            <div className="chart-header">
              <h3>6-Month Billing vs Revenue Collection Comparison</h3>
              <small>Comparative monthly financial billing generated vs payments collected</small>
            </div>

            <div className="block-bars-container">
              {BILLING_DATA.map((d) => (
                <div key={d.month} className="b-bar-col">
                  <span className="b-val">₹{(d.collected / 1000).toFixed(0)}k</span>
                  <div className="b-bar-wrapper">
                    <div className="b-bar-fill" style={{ height: `${(d.collected / 130000) * 120}px` }}></div>
                  </div>
                  <span className="b-name">{d.month.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* TABLE */}
          <section className="reports-table-card">
            <div className="table-controls-row">
              <div className="rpt-search-box">
                <span className="rpt-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search month..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <small>Showing {filtered.length} billing periods</small>
            </div>

            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Billing Period</th>
                    <th>Total Billed</th>
                    <th>Collected Revenue</th>
                    <th>Pending Amount</th>
                    <th>Overdue Amount</th>
                    <th>Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((b) => (
                      <tr key={b.month}>
                        <td><strong>{b.month}</strong></td>
                        <td>₹{b.billed.toLocaleString()}</td>
                        <td><strong className="text-price">₹{b.collected.toLocaleString()}</strong></td>
                        <td className="text-sub">₹{b.pending.toLocaleString()}</td>
                        <td className="text-danger">₹{b.overdue.toLocaleString()}</td>
                        <td>
                          <span className={`trend-badge ${b.rate >= 90 ? "positive" : "negative"}`}>
                            {b.rate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-table-msg">
                        No billing reports found for "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default BillingReports;
