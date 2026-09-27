import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";
import { useNavigate } from "react-router-dom";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, ChartTooltip, kl } from "./OpsLayout";

const monthNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Household-wise water-usage comparison for a chosen month, against the previous month.
export default function HouseholdComparison() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(monthNow());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("usage");

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    communityAdminService
      .getHouseholdUsage(month)
      .then((res) => !cancelled && setData(res.data))
      .catch((e) => !cancelled && setError(e.message || "Could not load household usage."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const rows = [...(data?.households || [])].sort((a, b) =>
    sort === "name" ? a.apartment.localeCompare(b.apartment, undefined, { numeric: true }) : b.consumptionKl - a.consumptionKl
  );
  const chartData = rows.map((h) => ({
    name: `${h.apartment}${h.building ? ` · ${h.building}` : ""}`,
    current: h.consumptionKl,
    previous: h.previousKl,
  }));
  const high = rows.filter((h) => data && data.averageKl > 0 && h.consumptionKl > data.averageKl * 1.5);

  return (
    <OpsLayout
      activePage="Household Comparison"
      title="Household Water-Usage Comparison"
      subtitle="Compare every household's consumption against the community average and the previous month"
      actions={
        <>
          <div className="cop-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label htmlFor="cmp-month">Month</label>
            <input id="cmp-month" type="month" value={month} max={monthNow()} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="cop-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label htmlFor="cmp-sort">Sort</label>
            <select id="cmp-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="usage">Highest usage</option>
              <option value="name">Apartment</option>
            </select>
          </div>
        </>
      }
    >
      {error && <Notice kind="error" onClose={() => setError("")}>{error}</Notice>}
      {loading && !data && <div className="cop-loading">Loading household usage…</div>}

      {data && (
        <>
          <div className="cop-stats">
            <div className="cop-stat">
              <span>Households</span>
              <strong>{rows.length}</strong>
              <small>{rows.filter((h) => h.readingDays > 0).length} with readings this month</small>
            </div>
            <div className="cop-stat">
              <span>Community total</span>
              <strong>{kl(data.totalKl)}</strong>
              <small>{data.from} to {data.to}</small>
            </div>
            <div className="cop-stat">
              <span>Average per household</span>
              <strong>{kl(data.averageKl)}</strong>
              <small>Dashed line on the chart</small>
            </div>
            <div className="cop-stat">
              <span>High users</span>
              <strong>{high.length}</strong>
              <small>More than 1.5× the average</small>
            </div>
          </div>

          <div className="cop-card">
            <div className="cop-card-head">
              <div>
                <h3>Consumption by household</h3>
                <p>{data.period} vs {data.previousPeriod}{data.period === monthNow() ? " (same days of the month)" : ""}</p>
              </div>
            </div>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 44 + 60)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} unit=" KL" />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: "#334155" }} />
                  <Tooltip content={(tp) => <ChartTooltip {...tp} />} cursor={{ fill: "rgba(7,155,155,0.06)" }} />
                  <Legend />
                  {data.averageKl > 0 && <ReferenceLine x={data.averageKl} stroke="#94a3b8" strokeDasharray="5 4" />}
                  <Bar dataKey="previous" name={data.previousPeriod} fill="#cbd5e1" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  <Bar dataKey="current" name={data.period} fill="#079b9b" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="cop-empty">No households are registered yet.</div>
            )}
          </div>

          <div className="cop-card">
            <div className="cop-card-head">
              <div>
                <h3>Household detail</h3>
                <p>Share is each household's portion of the community total</p>
              </div>
            </div>
            <div className="cop-table-wrap">
              <table className="cop-table">
                <thead>
                  <tr>
                    <th>Apartment</th>
                    <th>Meter</th>
                    <th className="num">This month</th>
                    <th className="num">Previous</th>
                    <th className="num">Change</th>
                    <th className="num">Share</th>
                    <th className="num">Reading days</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h) => (
                    <tr key={h.apartmentId}>
                      <td>
                        <button type="button" className="cop-link" onClick={() => navigate(`/admin/households/${h.apartmentId}`)}>
                          <strong>{h.apartment}</strong>
                        </button>{" "}
                        <span style={{ color: "#64748b" }}>{h.building}</span>
                      </td>
                      <td className="cop-mono">
                        {h.meterSerial || <span className="cop-pill warn">No meter</span>}
                      </td>
                      <td className="num"><strong>{kl(h.consumptionKl)}</strong></td>
                      <td className="num">{kl(h.previousKl)}</td>
                      <td className="num">
                        {h.changePct === undefined || h.changePct === null ? (
                          "—"
                        ) : (
                          <span className={h.changePct > 0 ? "cop-up" : "cop-down"}>
                            {h.changePct > 0 ? "▲" : "▼"} {Math.abs(h.changePct)}%
                          </span>
                        )}
                      </td>
                      <td className="num">{h.sharePct}%</td>
                      <td className="num">{h.readingDays}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="cop-empty">No households found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </OpsLayout>
  );
}
