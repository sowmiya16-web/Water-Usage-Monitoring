import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, ChartTooltip, inr, kl, fmtDate } from "../CommunityOps/OpsLayout";

// Community Admin dashboard — every figure comes from /api/community-admin/dashboard (MySQL).
function Overview() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    communityAdminService
      .getDashboard()
      .then((res) => !cancelled && setData(res.data))
      .catch(() =>
        !cancelled && setError("Couldn't load the dashboard. Make sure the server is running and you are signed in as a community admin.")
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const k = data?.kpis;
  const hh = data?.households;
  const tariff = data?.tariff;
  const cycle = data?.activeCycle;
  const top = (hh?.households || []).slice(0, 8).map((h) => ({ name: h.apartment, current: h.consumptionKl, previous: h.previousKl }));
  const sevPill = (s) => ((s || "").toUpperCase() === "CRITICAL" ? "bad" : (s || "").toUpperCase() === "WARNING" ? "warn" : (s || "").toUpperCase() === "SUCCESS" ? "ok" : "info");

  const shortcuts = [
    { title: "Household Comparison", sub: `${k?.households ?? "…"} household${k?.households === 1 ? "" : "s"}`, cta: "Compare usage →", to: "/admin/household-comparison" },
    { title: "Meter Readings", sub: `${k?.meters ?? "…"} meter${k?.meters === 1 ? "" : "s"} · ${k?.metersOnline ?? "…"} online`, cta: "Upload & manage →", to: "/admin/meter-readings" },
    { title: "Billing Cycles", sub: cycle ? `Open: ${cycle.name}` : "No open cycle", cta: "Manage cycles →", to: "/admin/billing-cycles" },
    { title: "Tariff Versions", sub: tariff ? `Current: v${tariff.version}` : "Default plan", cta: "View history →", to: "/admin/tariff-versions" },
    { title: "Bulk Water Purchases", sub: k ? `${kl(k.purchasedKlThisMonth)} this month` : "…", cta: "Record & review →", to: "/admin/bulk-purchases" },
  ];

  return (
    <OpsLayout
      activePage="Overview"
      title="Community Admin Dashboard"
      actions={
        <>
          <div className="cop-clock">
            <span>SYSTEM TIME</span>
            <strong>{now.toLocaleTimeString()}</strong>
          </div>
        </>
      }
    >
      <Notice kind="error">{error}</Notice>
      {loading && <div className="cop-loading">Loading dashboard…</div>}

      {data && (
        <>
          <section className="cop-shortcuts">
            {shortcuts.map((s) => (
              <button key={s.title} type="button" className="cop-shortcut" onClick={() => navigate(s.to)}>
                <strong>{s.title}</strong>
                <span>{s.sub}</span>
                <em>{s.cta}</em>
              </button>
            ))}
          </section>

          <section className="cop-stats">
            <div className="cop-stat">
              <span>Households</span>
              <strong>{k.households}</strong>
              <small>{k.occupied} occupied · {k.households - k.occupied} other</small>
            </div>
            <div className="cop-stat">
              <span>Consumption this month</span>
              <strong>{kl(k.monthToDateKl)}</strong>
              <small>Avg {kl(k.avgDailyKl)} / day</small>
            </div>
            <div className="cop-stat">
              <span>Revenue collected</span>
              <strong>{inr(k.collected)}</strong>
              <small>{k.paidBills} paid · {inr(k.outstanding)} outstanding ({k.pendingBills} pending) · {k.collectionRatePct}%</small>
            </div>
            <div className="cop-stat">
              <span>Smart meters</span>
              <strong>{k.meters}</strong>
              <small>{k.metersOnline} online · {k.metersAttention} need attention</small>
            </div>
          </section>

          <section className="cop-grid-2">
            <div className="cop-card">
              <div className="cop-card-head">
                <div>
                  <h3>Supply, consumption &amp; billing — last 6 months</h3>
                  <p>Bulk water purchased vs. water metered at households, with billed revenue</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis yAxisId="kl" tick={{ fontSize: 11, fill: "#64748b" }} unit=" KL" />
                  <YAxis yAxisId="inr" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                  <Tooltip content={(tp) => <ChartTooltip {...tp} unit="" />} />
                  <Legend />
                  <Bar yAxisId="kl" dataKey="purchasedKl" name="Purchased (KL)" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar yAxisId="kl" dataKey="consumptionKl" name="Consumed (KL)" fill="#079b9b" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Line yAxisId="inr" type="monotone" dataKey="billedAmount" name="Billed (₹)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="cop-card">
              <div className="cop-card-head">
                <div>
                  <h3>Current billing cycle &amp; tariff</h3>
                  <p>What is being billed right now</p>
                </div>
              </div>
              {cycle ? (
                <div style={{ marginBottom: 14 }}>
                  <span className="cop-pill ok">OPEN</span> <strong>{cycle.name}</strong>
                  <div style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 8px" }}>
                    {fmtDate(cycle.startDate)} – {fmtDate(cycle.endDate)}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {kl(cycle.consumptionKl)} consumed · {kl(cycle.purchasedKl)} purchased · {cycle.billCount} bills ({inr(cycle.billedAmount)})
                  </div>
                </div>
              ) : (
                <div className="cop-empty" style={{ padding: "10px 0 16px", textAlign: "left" }}>
                  No open billing cycle.{" "}
                  <button className="cop-link" onClick={() => navigate("/admin/billing-cycles")}>Create one →</button>
                </div>
              )}
              {tariff && (
                <table className="cop-table">
                  <tbody>
                    <tr><td>Version</td><td className="num"><strong>v{tariff.version}</strong></td></tr>
                    <tr><td>Tier 1 (up to {tariff.tier1LimitKl} KL)</td><td className="num">{inr(tariff.tier1RatePerKl)} / KL</td></tr>
                    <tr><td>Tier 2 (up to {tariff.tier2LimitKl} KL)</td><td className="num">{inr(tariff.tier2RatePerKl)} / KL</td></tr>
                    <tr><td>Tier 3 (above)</td><td className="num">{inr(tariff.tier3RatePerKl)} / KL</td></tr>
                    <tr><td>Base + common charge</td><td className="num">{inr(tariff.fixedBaseCharge)} + {inr(tariff.commonWaterCharge)}</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="cop-grid-2">
            <div className="cop-card">
              <div className="cop-card-head">
                <div>
                  <h3>Household usage — {hh.period}</h3>
                  <p>Top {top.length} households vs the previous month</p>
                </div>
                <button className="cop-link" onClick={() => navigate("/admin/household-comparison")}>Full comparison →</button>
              </div>
              {top.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} unit=" KL" />
                    <Tooltip content={(tp) => <ChartTooltip {...tp} />} cursor={{ fill: "rgba(7,155,155,0.06)" }} />
                    <Legend />
                    {hh.averageKl > 0 && <ReferenceLine y={hh.averageKl} stroke="#94a3b8" strokeDasharray="5 4" />}
                    <Bar dataKey="previous" name={hh.previousPeriod} fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="current" name={hh.period} fill="#079b9b" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="cop-empty">No households registered yet.</div>
              )}
            </div>

            <div className="cop-card">
              <div className="cop-card-head">
                <div>
                  <h3>System alerts</h3>
                  <p>Latest across the community</p>
                </div>
                <button className="cop-link" onClick={() => navigate("/admin/alerts-notifications")}>View all →</button>
              </div>
              {data.alerts?.length ? (
                <div className="cop-table-wrap">
                  <table className="cop-table">
                    <tbody>
                      {data.alerts.map((a) => (
                        <tr key={a.alertId}>
                          <td>
                            <strong>{a.title}</strong>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{a.apartment ? `Apt ${a.apartment} · ` : ""}{a.createdAt ? new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</div>
                          </td>
                          <td className="num"><span className={`cop-pill ${sevPill(a.severity)}`}>{a.severity}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="cop-empty">No alerts recorded.</div>
              )}
            </div>
          </section>
        </>
      )}
    </OpsLayout>
  );
}

export default Overview;
