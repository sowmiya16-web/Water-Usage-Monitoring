import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./ConsumptionReports.css";

const CONSUMPTION_DATA = [
  { block: "Block A", units: 8, totalKL: 148.6, avgPerUnit: 18.6, highest: 24.2, lowest: 12.1, change: -6.2 },
  { block: "Block B", units: 10, totalKL: 201.4, avgPerUnit: 20.1, highest: 28.5, lowest: 14.3, change: +2.1 },
  { block: "Block C", units: 8, totalKL: 176.8, avgPerUnit: 22.1, highest: 30.4, lowest: 15.8, change: +4.5 },
  { block: "Block D", units: 10, totalKL: 185.2, avgPerUnit: 18.5, highest: 25.1, lowest: 11.9, change: -1.8 },
  { block: "Block E", units: 8, totalKL: 157.3, avgPerUnit: 19.7, highest: 26.8, lowest: 13.2, change: -3.4 },
  { block: "Block F", units: 6, totalKL: 110.6, avgPerUnit: 18.4, highest: 22.5, lowest: 14.1, change: +0.9 },
];

const PERIOD_OPTIONS = ["August 2026", "July 2026", "June 2026"];

function ConsumptionReports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("August 2026");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CONSUMPTION_DATA.filter((r) => r.block.toLowerCase().includes(q));
  }, [search]);

  const totals = {
    units: CONSUMPTION_DATA.reduce((s, r) => s + r.units, 0),
    totalKL: CONSUMPTION_DATA.reduce((s, r) => s + r.totalKL, 0),
    avgPerUnit: (
      CONSUMPTION_DATA.reduce((s, r) => s + r.avgPerUnit, 0) / CONSUMPTION_DATA.length
    ).toFixed(1),
  };

  const handleExportCSV = () => {
    const headers = ["Block Zone", "Units Count", "Total Volume (KL)", "Avg / Unit (KL)", "Highest (KL)", "Lowest (KL)", "Monthly Trend (%)"];
    const rows = filtered.map((r) => [r.block, r.units, `${r.totalKL} KL`, `${r.avgPerUnit} KL`, `${r.highest} KL`, `${r.lowest} KL`, `${r.change}%`]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Consumption_Reports_${period.replace(" ", "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <AdminSidebar activePage="Consumption Reports" />

      <main className="admin-reports-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">REPORTS & ANALYTICS</span>
            <h1>Water Consumption Reports</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              📊 Export CSV Report
            </button>
          </div>
        </header>

        <div className="reports-content-container">
          {/* PERIOD FILTER TABS */}
          <section className="reports-filter-bar">
            <div className="filter-tabs-row">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`report-tab ${period === p ? "active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* SUMMARY KPI CARDS */}
          <section className="reports-kpi-grid">
            <div className="report-kpi-card">
              <span>TOTAL ACTIVE ZONES</span>
              <strong>{CONSUMPTION_DATA.length} <small>Blocks</small></strong>
              <small>Block A to Block F</small>
            </div>

            <div className="report-kpi-card highlight">
              <span>TOTAL CONSUMPTION</span>
              <strong>{totals.totalKL.toFixed(1)} <small>KL</small></strong>
              <small>Period: {period}</small>
            </div>

            <div className="report-kpi-card">
              <span>REGISTERED HOUSEHOLDS</span>
              <strong>{totals.units} <small>Units</small></strong>
              <small>Metered Occupants</small>
            </div>

            <div className="report-kpi-card">
              <span>AVG CONSUMPTION / UNIT</span>
              <strong>{totals.avgPerUnit} <small>KL</small></strong>
              <small>Society Average Benchmark</small>
            </div>
          </section>

          {/* BLOCK CONSUMPTION DISTRIBUTION CHART */}
          <section className="reports-chart-card">
            <div className="chart-header">
              <h3>Block-wise Water Consumption Distribution ({period})</h3>
              <small>Comparative total volume consumed by building blocks (in KL)</small>
            </div>

            <div className="block-bars-container">
              {CONSUMPTION_DATA.map((b) => (
                <div key={b.block} className="b-bar-col">
                  <span className="b-val">{b.totalKL} KL</span>
                  <div className="b-bar-wrapper">
                    <div className="b-bar-fill" style={{ height: `${(b.totalKL / 220) * 120}px` }}></div>
                  </div>
                  <span className="b-name">{b.block}</span>
                </div>
              ))}
            </div>
          </section>

          {/* DIRECTORY TABLE */}
          <section className="reports-table-card">
            <div className="table-controls-row">
              <div className="rpt-search-box">
                <span className="rpt-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search block zone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <small>Showing {filtered.length} of {CONSUMPTION_DATA.length} blocks</small>
            </div>

            <div className="table-wrapper-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Block Zone</th>
                    <th>Units</th>
                    <th>Total Volume</th>
                    <th>Avg / Unit</th>
                    <th>Highest Unit</th>
                    <th>Lowest Unit</th>
                    <th>Monthly Change</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.block}>
                        <td><strong>{row.block}</strong></td>
                        <td>{row.units} Units</td>
                        <td><strong className="text-price">{row.totalKL.toFixed(1)} KL</strong></td>
                        <td>{row.avgPerUnit.toFixed(1)} KL</td>
                        <td className="text-sub">{row.highest} KL</td>
                        <td className="text-sub">{row.lowest} KL</td>
                        <td>
                          <span className={`trend-badge ${row.change <= 0 ? "positive" : "negative"}`}>
                            {row.change > 0 ? "+" : ""}{row.change.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-table-msg">
                        No consumption data found for "{search}".
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

export default ConsumptionReports;
