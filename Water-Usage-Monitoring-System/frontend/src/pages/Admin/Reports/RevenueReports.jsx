import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./RevenueReports.css";

const REVENUE_DATA = [
  { month: "August 2026", total: 102300, upi: 63426, netbank: 24552, card: 14322 },
  { month: "July 2026", total: 116000, upi: 71920, netbank: 27840, card: 16240 },
  { month: "June 2026", total: 118000, upi: 73160, netbank: 28320, card: 16520 },
  { month: "May 2026", total: 115000, upi: 71300, netbank: 27600, card: 16100 },
  { month: "April 2026", total: 110000, upi: 68200, netbank: 26400, card: 15400 },
  { month: "March 2026", total: 102000, upi: 63240, netbank: 24480, card: 14280 },
];

function RevenueReports() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return REVENUE_DATA.filter((r) => r.month.toLowerCase().includes(q));
  }, [search]);

  const totalRevenue = REVENUE_DATA.reduce((s, r) => s + r.total, 0);
  const totalUPI = REVENUE_DATA.reduce((s, r) => s + r.upi, 0);
  const totalNetBank = REVENUE_DATA.reduce((s, r) => s + r.netbank, 0);
  const totalCard = REVENUE_DATA.reduce((s, r) => s + r.card, 0);

  const handleExportCSV = () => {
    const headers = ["Revenue Month", "Total Revenue (INR)", "UPI Channel (INR)", "NetBanking Channel (INR)", "Card Channel (INR)"];
    const rows = filtered.map((r) => [r.month, `₹${r.total}`, `₹${r.upi}`, `₹${r.netbank}`, `₹${r.card}`]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Revenue_Reports_2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Revenue Reports" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">REPORTS & ANALYTICS</span>
            <h1>Revenue & Payment Gateway Reports</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              💵 Export Revenue CSV
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {/* KPI GRID */}
          <section className="reports-kpi-grid">
            <div className="report-kpi-card highlight">
              <span>CUMULATIVE 6-MONTH REVENUE</span>
              <strong className="text-success">₹{(totalRevenue / 1000).toFixed(1)}k</strong>
              <small>Processed Gateway Inflow</small>
            </div>

            <div className="report-kpi-card">
              <span>UPI / INSTANT PAY SHARE</span>
              <strong>₹{(totalUPI / 1000).toFixed(1)}k</strong>
              <small>{((totalUPI / totalRevenue) * 100).toFixed(1)}% Total Share</small>
            </div>

            <div className="report-kpi-card">
              <span>NETBANKING CHANNEL SHARE</span>
              <strong>₹{(totalNetBank / 1000).toFixed(1)}k</strong>
              <small>{((totalNetBank / totalRevenue) * 100).toFixed(1)}% Total Share</small>
            </div>

            <div className="report-kpi-card">
              <span>CARD CHANNEL SHARE</span>
              <strong>₹{(totalCard / 1000).toFixed(1)}k</strong>
              <small>{((totalCard / totalRevenue) * 100).toFixed(1)}% Total Share</small>
            </div>
          </section>

          {/* REVENUE METHOD PROGRESS BARS */}
          <section className="reports-chart-card">
            <div className="chart-header">
              <h3>Gateway Payment Channel Breakdown</h3>
              <small>Percentage distribution of processed resident payments</small>
            </div>

            <div className="distribution-bars-container" style={{ marginTop: "16px" }}>
              <div className="d-bar-row">
                <div className="d-label"><span>UPI / Instant Pay (62%)</span><strong>₹{totalUPI.toLocaleString()}</strong></div>
                <div className="d-progress"><div className="d-fill upi" style={{ width: "62%" }}></div></div>
              </div>

              <div className="d-bar-row">
                <div className="d-label"><span>NetBanking Direct Debit (24%)</span><strong>₹{totalNetBank.toLocaleString()}</strong></div>
                <div className="d-progress"><div className="d-fill netbank" style={{ width: "24%" }}></div></div>
              </div>

              <div className="d-bar-row">
                <div className="d-label"><span>Credit / Debit Cards (14%)</span><strong>₹{totalCard.toLocaleString()}</strong></div>
                <div className="d-progress"><div className="d-fill cards" style={{ width: "14%" }}></div></div>
              </div>
            </div>
          </section>

          {/* TABLE */}
          <section className="reports-table-card">
            <div className="table-controls-row">
              <div className="rpt-search-box">
                <span className="rpt-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search revenue month..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <small>Showing {filtered.length} revenue periods</small>
            </div>

            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Revenue Period</th>
                    <th>Total Revenue</th>
                    <th>UPI Share</th>
                    <th>NetBanking Share</th>
                    <th>Card Share</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((r) => (
                      <tr key={r.month}>
                        <td><strong>{r.month}</strong></td>
                        <td><strong className="text-price">₹{r.total.toLocaleString()}</strong></td>
                        <td>₹{r.upi.toLocaleString()}</td>
                        <td>₹{r.netbank.toLocaleString()}</td>
                        <td className="text-sub">₹{r.card.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-table-msg">
                        No revenue reports found for "{search}".
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

export default RevenueReports;
