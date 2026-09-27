import React, { useState } from "react";
import CommunityAdminSidebar from "../../../components/CommunityAdminSidebar/CommunityAdminSidebar";
import "../CommunityAdminCommon.css";

function CommunityConsumption() {
  const [timeframe, setTimeframe] = useState("Today");

  const [towerUsage] = useState([
    { tower: "Tower A (48 Units)", todayKL: "32.4 KL", weeklyKL: "228.1 KL", monthlyKL: "964.5 KL", avgPerFlat: "675 L/day", status: "Optimal" },
    { tower: "Tower B (48 Units)", todayKL: "38.2 KL", weeklyKL: "264.8 KL", monthlyKL: "1,114.2 KL", avgPerFlat: "795 L/day", status: "Slightly Elevated" },
    { tower: "Tower C (46 Units)", todayKL: "24.2 KL", weeklyKL: "172.0 KL", monthlyKL: "766.3 KL", avgPerFlat: "526 L/day", status: "Efficient" },
  ]);

  return (
    <div className="comm-page-container">
      <CommunityAdminSidebar activePage="Consumption Monitoring" />

      <main className="comm-main-content">
        <header className="comm-page-header">
          <div className="comm-header-left">
            <span className="comm-page-badge">TOWNSHIP METRICS</span>
            <h1>Consumption Monitoring</h1>
            <p>Real-time community water usage telemetry, block balances, and aggregate demand</p>
          </div>
          <div className="comm-header-right">
            <select
              className="comm-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="Today">Today (Real-time)</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
          </div>
        </header>

        <div className="comm-body-content">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>💧</div>
              <div className="comm-stat-info">
                <span>Aggregate Today</span>
                <strong>94.8 KL</strong>
                <p>Peak: 140.5 L/min at 08:30 AM</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>📈</div>
              <div className="comm-stat-info">
                <span>Monthly Total</span>
                <strong>2,845 KL</strong>
                <p>Within Projected Budget</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>⚡</div>
              <div className="comm-stat-info">
                <span>Per Household Avg</span>
                <strong>668 L / day</strong>
                <p>Benchmarked vs City Standard</p>
              </div>
            </div>
            <div className="comm-stat-card">
              <div className="comm-stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>🌿</div>
              <div className="comm-stat-info">
                <span>Conservation Score</span>
                <strong>94 / 100</strong>
                <p>Top 5% Eco-friendly Complex</p>
              </div>
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-header">
              <div>
                <h2>Block-Wise Water Consumption Distribution</h2>
                <p>Aggregate flow volume breakdown across residential towers</p>
              </div>
            </div>

            <div className="comm-table-container">
              <table className="comm-table">
                <thead>
                  <tr>
                    <th>Residential Block</th>
                    <th>Today Volume</th>
                    <th>Weekly Volume</th>
                    <th>Monthly Aggregate</th>
                    <th>Average Per Unit</th>
                    <th>Efficiency Status</th>
                    <th>Trend Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {towerUsage.map((t) => (
                    <tr key={t.tower}>
                      <td><strong>{t.tower}</strong></td>
                      <td><strong style={{ color: "#0284c7" }}>{t.todayKL}</strong></td>
                      <td>{t.weeklyKL}</td>
                      <td><strong>{t.monthlyKL}</strong></td>
                      <td>{t.avgPerFlat}</td>
                      <td>
                        <span
                          className={`comm-badge ${
                            t.status === "Efficient"
                              ? "badge-success"
                              : t.status === "Optimal"
                              ? "badge-info"
                              : "badge-warning"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="comm-btn-outline"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                          onClick={() => alert(`Showing detailed hourly curves for ${t.tower}`)}
                        >
                          View Curves
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

export default CommunityConsumption;
