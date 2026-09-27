import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Area,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import SessionNotice from "../../../components/SessionNotice/SessionNotice";
import dashboardService from "../../../services/dashboardService";
import "../Dashboard/Overview.css";
import "../Dashboard/ResidentDashboard.css";
import "./ConsumptionComparison.css";

const ROUTES = {
  Overview: "/resident/dashboard",
  "Water Consumption": "/resident/water-consumption",
  "Usage History": "/resident/usage-history",
  "Meter Details": "/resident/meter-details",
  "Consumption Comparison": "/resident/consumption-comparison",
  "Current Bill": "/resident/current-bill",
  "Billing History": "/resident/billing-history",
  "Payment History": "/resident/payment-history",
  Notifications: "/resident/notifications",
  Alerts: "/resident/alerts",
  "My Profile": "/resident/profile",
  "Account Settings": "/resident/settings",
  "Help & Support": "/resident/help",
};

const COLORS = { you: "#079b9b", yourAvg: "#94a3b8", peers: "#2563eb", community: "#f59e0b", above: "#ef4444", below: "#10b981" };
const num = (v) => v !== undefined && v !== null && !Number.isNaN(v);
const kl = (v) => (num(v) ? `${Number(v).toFixed(2)} KL` : "—");
const pctText = (p) => (num(p) ? `${Math.abs(p).toFixed(1)}% ${p > 0 ? "above" : p < 0 ? "below" : "at"}` : "—");
const inr = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function CompareTooltip({ active, payload, label, series }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rc-tooltip">
      <strong>{label}</strong>
      {series.map(
        (s) =>
          num(p[s.key]) && (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.name}: <b>{Number(p[s.key]).toFixed(2)} KL</b>
            </span>
          )
      )}
      {num(p.diff) && (
        <em className={p.diff > 0 ? "up" : "down"}>
          {p.diff > 0 ? "+" : ""}
          {p.diff.toFixed(2)} KL ({p.diff > 0 ? "+" : ""}
          {num(p.pct) ? p.pct.toFixed(1) : "0"}%) vs {p.refName}
        </em>
      )}
    </div>
  );
}

function DiffTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (!num(p.diff)) return null;
  return (
    <div className="rc-tooltip">
      <strong>{label}</strong>
      <span>
        You: <b>{kl(p.you)}</b>
      </span>
      <span>
        {p.refName}: <b>{kl(p.refValue)}</b>
      </span>
      <em className={p.diff > 0 ? "up" : "down"}>
        {p.diff > 0 ? "+" : ""}
        {p.diff.toFixed(2)} KL ({pctText(p.pct)} {p.refName})
      </em>
    </div>
  );
}

function ConsumptionComparison() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState("daily");
  const [hidden, setHidden] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardService
      .getConsumptionComparison()
      .then((res) => !cancelled && setData(res.data))
      .catch((e) => !cancelled && setError({ status: e.status, message: "Couldn't load your comparison." }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const handleNavigation = (page) => ROUTES[page] && navigate(ROUTES[page]);

  const group = data?.peerGroup;
  const summary = view === "daily" ? data?.last30 : data?.monthToDate;
  const usePeers = !!group?.peerAvailable;
  const useCommunity = !!group?.communityAvailable;
  const showCommunity = useCommunity && !group?.peersSameAsCommunity;
  const hasReference = usePeers || useCommunity;

  // The figure the difference chart compares against: neighbours first, then community, else the resident's own average.
  const refKey = usePeers ? "peerAvg" : useCommunity ? "communityAvg" : "yourAverage";
  const refName = usePeers ? "neighbours" : useCommunity ? "community average" : "your average";

  const points = useMemo(() => {
    const src = (view === "daily" ? data?.daily : data?.monthly) || [];
    return src.map((p) => {
      const ref = p[refKey];
      const diff = num(p.you) && num(ref) ? +(p.you - ref).toFixed(2) : null;
      return { ...p, refValue: ref, refName, diff, pct: diff !== null && ref > 0 ? +((diff / ref) * 100).toFixed(1) : null };
    });
  }, [data, view, refKey, refName]);

  const series = [
    { key: "you", name: "You", color: COLORS.you, on: true },
    { key: "peerAvg", name: `Neighbours in ${data?.building || "your building"}`, color: COLORS.peers, on: usePeers },
    { key: "communityAvg", name: "Community average", color: COLORS.community, on: showCommunity },
    { key: "yourAverage", name: view === "daily" ? "Your 30-day average" : "Your 6-month average", color: COLORS.yourAvg, on: true },
  ].filter((s) => s.on);
  const shown = (k) => !hidden[k];
  const toggle = (k) => setHidden((h) => ({ ...h, [k]: !h[k] }));

  const hasYou = points.some((p) => num(p.you));
  const hasDiff = points.some((p) => num(p.diff));
  const insights = data?.insights || [];
  const recs = data?.recommendations || [];

  const statusCard = (title, value, sub, tone) => (
    <div className="rd-kpi rc-kpi">
      <span>{title}</span>
      <strong className={tone || ""}>{value}</strong>
      <small>{sub}</small>
    </div>
  );

  const vs = (diff, pct, avail, name) =>
    avail && num(diff)
      ? statusCard(
          `VS ${name}`,
          `${diff > 0 ? "+" : ""}${diff.toFixed(2)} KL`,
          <>
            <b className={pct > 0 ? "rc-up" : "rc-down"}>
              {pct > 0 ? "▲" : "▼"} {pctText(pct)}
            </b>{" "}
            average
          </>,
          diff > 0 ? "rc-up" : "rc-down"
        )
      : statusCard(`VS ${name}`, "—", `Needs ${group?.minGroupSize ?? 3}+ other households`);

  return (
    <div className="resident-dashboard">
      <Sidebar activePage="Consumption Comparison" onNavigate={handleNavigation} onLogout={() => {
        ["isAuthenticated", "userRole", "accessType", "userEmail", "authToken"].forEach((k) => localStorage.removeItem(k));
        navigate("/login", { replace: true });
      }} />

      <main className="resident-main">
        <Header activePage="Consumption Comparison" />

        <div className="dashboard-content rd-content">
          <section className="rd-welcome">
            <div>
              <span className="rd-eyebrow">CONSUMPTION COMPARISON</span>
              <h2>How your water use compares</h2>
              <p>
                {data?.apartment
                  ? `Apartment ${data.apartment}${data.building ? `, ${data.building}` : ""} · compared with ${
                      usePeers ? "similar households in your building" : useCommunity ? "the community average" : "your own history"
                    }`
                  : "Your usage against neighbours and the community."}
              </p>
            </div>
            <div className="rc-toggle" role="tablist" aria-label="Comparison period">
              {[
                ["daily", "Daily · 30 days"],
                ["monthly", "Monthly · 6 months"],
              ].map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={view === k} className={view === k ? "active" : ""} onClick={() => setView(k)}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {loading && <div className="rd-state">Loading your comparison…</div>}
          <SessionNotice error={error} what="your comparison" onRetry={() => setAttempt((n) => n + 1)} />

          {data && (
            <>
              {!hasReference && group && (
                <div className="rc-notice">
                  <strong>Neighbour comparison isn't available yet.</strong> To protect privacy, averages are only shown once at least{" "}
                  {group.minGroupSize} other households have meter readings (currently {group.communityHouseholds}). Meanwhile, the charts compare
                  you with your own average.
                </div>
              )}

              <section className="rc-kpis">
                {statusCard(
                  summary?.period?.toUpperCase() || "YOUR USAGE",
                  kl(summary?.youKl),
                  view === "daily" ? "Your total for the period" : "Your month-to-date total"
                )}
                {vs(summary?.diffVsPeersKl, summary?.pctVsPeers, usePeers, "NEIGHBOURS")}
                {vs(summary?.diffVsCommunityKl, summary?.pctVsCommunity, useCommunity, "COMMUNITY")}
                {statusCard(
                  "YOUR RANK",
                  num(summary?.percentileLower) ? `${summary.percentileLower}%` : "—",
                  num(summary?.percentileLower) ? "of other households use more water than you" : `Needs ${group?.minGroupSize ?? 3}+ other households`,
                  num(summary?.percentileLower) ? (summary.percentileLower >= 50 ? "rc-down" : "rc-up") : ""
                )}
              </section>

              <section className="rd-card">
                <div className="rd-card-head">
                  <div>
                    <h3>{view === "daily" ? "Daily consumption" : "Monthly consumption"}</h3>
                    <p>
                      {view === "daily"
                        ? "Last 30 days, in kilolitres per day"
                        : "Last 6 months, in kilolitres (current month is month-to-date)"}{" "}
                      · click a legend chip to show or hide a line
                    </p>
                  </div>
                </div>

                <div className="rc-legend">
                  {series.map((s) => (
                    <button key={s.key} type="button" className={shown(s.key) ? "" : "off"} aria-pressed={shown(s.key)} onClick={() => toggle(s.key)}>
                      <i style={{ background: s.color }} />
                      {s.name}
                    </button>
                  ))}
                </div>

                {hasYou ? (
                  <ResponsiveContainer width="100%" height={300}>
                    {view === "daily" ? (
                      <ComposedChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rcYou" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={COLORS.you} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={COLORS.you} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} interval="preserveStartEnd" minTickGap={24} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} unit=" KL" />
                        <Tooltip content={(tp) => <CompareTooltip {...tp} series={series} />} />
                        {shown("yourAverage") && <Line type="monotone" dataKey="yourAverage" stroke={COLORS.yourAvg} strokeDasharray="5 4" dot={false} strokeWidth={1.5} activeDot={false} />}
                        {usePeers && shown("peerAvg") && <Line type="monotone" dataKey="peerAvg" stroke={COLORS.peers} strokeWidth={2} dot={false} connectNulls />}
                        {showCommunity && shown("communityAvg") && <Line type="monotone" dataKey="communityAvg" stroke={COLORS.community} strokeWidth={2} strokeDasharray="2 3" dot={false} connectNulls />}
                        {shown("you") && <Area type="monotone" dataKey="you" stroke={COLORS.you} strokeWidth={2.5} fill="url(#rcYou)" connectNulls={false} />}
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} unit=" KL" />
                        <Tooltip content={(tp) => <CompareTooltip {...tp} series={series} />} cursor={{ fill: "rgba(7,155,155,0.06)" }} />
                        {shown("you") && <Bar dataKey="you" fill={COLORS.you} radius={[5, 5, 0, 0]} maxBarSize={30} />}
                        {usePeers && shown("peerAvg") && <Bar dataKey="peerAvg" fill={COLORS.peers} radius={[5, 5, 0, 0]} maxBarSize={30} />}
                        {showCommunity && shown("communityAvg") && <Bar dataKey="communityAvg" fill={COLORS.community} radius={[5, 5, 0, 0]} maxBarSize={30} />}
                        {shown("yourAverage") && <Line type="monotone" dataKey="yourAverage" stroke={COLORS.yourAvg} strokeDasharray="5 4" dot={false} strokeWidth={1.5} activeDot={false} />}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="rd-empty">No meter readings for this period yet.</div>
                )}
              </section>

              <section className="rd-card">
                <div className="rd-card-head">
                  <div>
                    <h3>Usage difference vs {refName}</h3>
                    <p>
                      <span className="rc-dot bad" /> above {refName} &nbsp; <span className="rc-dot good" /> below {refName}
                    </p>
                  </div>
                  {summary && hasReference && (
                    <span className={`rc-pill ${(usePeers ? summary.pctVsPeers : summary.pctVsCommunity) > 0 ? "bad" : "good"}`}>
                      {pctText(usePeers ? summary.pctVsPeers : summary.pctVsCommunity)} average
                    </span>
                  )}
                </div>
                {hasDiff ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} interval="preserveStartEnd" minTickGap={24} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} unit=" KL" />
                      <Tooltip content={(tp) => <DiffTooltip {...tp} />} cursor={{ fill: "rgba(100,116,139,0.08)" }} />
                      <ReferenceLine y={0} stroke="#64748b" />
                      <Bar dataKey="diff" radius={[3, 3, 0, 0]} maxBarSize={22}>
                        {points.map((p) => (
                          <Cell key={p.key} fill={p.diff > 0 ? COLORS.above : COLORS.below} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="rd-empty">Not enough data to show differences yet.</div>
                )}
              </section>

              <section className="rc-bottom">
                <div className="rd-card">
                  <div className="rd-card-head">
                    <div>
                      <h3>Conservation insights</h3>
                      <p>What your numbers say</p>
                    </div>
                  </div>
                  {insights.length ? (
                    <ul className="rc-list">
                      {insights.map((i, n) => (
                        <li key={n} className={`tone-${i.tone}`}>
                          <strong>{i.title}</strong>
                          <p>{i.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rd-empty">No insights yet.</div>
                  )}
                </div>

                <div className="rd-card">
                  <div className="rd-card-head">
                    <div>
                      <h3>💧 Water-saving recommendations</h3>
                      <p>Based on your comparison</p>
                    </div>
                  </div>
                  {num(data.estMonthlySavingRupees) && (
                    <div className="rc-saving">
                      Matching {refName} could save about <b>{inr(data.estMonthlySavingRupees)}</b> a month on your bill (estimate at your current tariff).
                    </div>
                  )}
                  <ul className="rc-list">
                    {recs.map((r, n) => (
                      <li key={n} className={`prio-${r.priority}`}>
                        <strong>
                          {r.title}
                          {num(r.estSavingKlPerMonth) && <span className="rc-chip">≈ {r.estSavingKlPerMonth} KL / month</span>}
                        </strong>
                        <p>{r.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rc-footnotes">
                {(data.notes || []).map((n, i) => (
                  <p key={i}>ⓘ {n}</p>
                ))}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ConsumptionComparison;
