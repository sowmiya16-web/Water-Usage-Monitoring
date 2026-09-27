import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import SessionNotice from "../../../components/SessionNotice/SessionNotice";
import dashboardService from "../../../services/dashboardService";
import invoiceService from "../../../services/invoiceService";
import "./Overview.css";
import "./ResidentDashboard.css";

const ROUTES = {
  Overview: "/resident/dashboard",
  "Water Consumption": "/resident/water-consumption",
  "Usage History": "/resident/usage-history",
  "Meter Details": "/resident/meter-details",
  "Current Bill": "/resident/current-bill",
  "Billing History": "/resident/billing-history",
  "Payment History": "/resident/payment-history",
  Notifications: "/resident/notifications",
  Alerts: "/resident/alerts",
  "My Profile": "/resident/profile",
  "Account Settings": "/resident/settings",
  "Help & Support": "/resident/help",
};

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const kl = (n) => (n === undefined || n === null ? "—" : `${Number(n).toFixed(2)} KL`);

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days} day${days > 1 ? "s" : ""} ago` : new Date(iso).toLocaleDateString();
}

function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  const label = s === "PAID" ? "Paid" : s === "PENDING" ? "Due" : s === "SUPERSEDED" ? "Recalculated" : status;
  return <span className={`rd-badge rd-badge-${s.toLowerCase()}`}>{label}</span>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length || payload[0].value === undefined) return null;
  return (
    <div className="rd-tooltip">
      <strong>{label}</strong>
      <span>{Number(payload[0].value).toFixed(2)} KL</span>
    </div>
  );
}

function Overview() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [pdfError, setPdfError] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardService
      .getResidentDashboard()
      .then((res) => !cancelled && setData(res.data))
      .catch((e) => !cancelled && setError({ status: e.status, message: "Couldn't load your dashboard." }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const handleNavigation = (page) => ROUTES[page] && navigate(ROUTES[page]);

  const handleLogout = () => {
    ["isAuthenticated", "userRole", "accessType", "userEmail", "authToken"].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const downloadInvoice = async (row) => {
    setPdfError("");
    setDownloading(row.billId);
    try {
      await invoiceService.openInvoice(row.invoiceId, `Invoice_${row.billNumber}.pdf`);
    } catch {
      setPdfError(`Couldn't download the PDF for ${row.billNumber}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  const today = new Date();
  const cb = data?.currentBill;
  const k = data?.kpis;
  const hasDaily = data?.daily?.some((d) => d.consumptionKl !== undefined);
  const hasMonthly = data?.monthly?.some((m) => m.consumptionKl !== undefined);
  const avg = k?.avgDailyKl30;

  return (
    <div className="resident-dashboard">
      <Sidebar activePage="Overview" onNavigate={handleNavigation} onLogout={handleLogout} />

      <main className="resident-main">
        <Header activePage="Overview" />

        <div className="dashboard-content rd-content">
          {/* Welcome */}
          <section className="rd-welcome">
            <div>
              <span className="rd-eyebrow">RESIDENT DASHBOARD</span>
              <h2>Welcome back, {profile.name}</h2>
              <p>
                Your water usage and billing overview for{" "}
                {today.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                {data?.apartment ? ` · Apartment ${data.apartment}${data.building ? `, ${data.building}` : ""}` : ""}.
              </p>
            </div>
            {data?.meterSerial && (
              <div className="rd-meter-pill">
                <span className={`rd-dot ${data.meterStatus === "ONLINE" ? "on" : "warn"}`} />
                Meter {data.meterSerial} · {data.meterStatus}
              </div>
            )}
          </section>

          {loading && <div className="rd-state">Loading your dashboard…</div>}
          <SessionNotice error={error} what="your dashboard" onRetry={() => setAttempt((n) => n + 1)} />

          {data && (
            <>
              {/* Billing cycle summary + KPIs */}
              <section className="rd-top">
                <div className={`rd-bill-card ${cb?.status === "PENDING" ? "due" : "clear"}`}>
                  <div className="rd-bill-head">
                    <span className="rd-eyebrow light">CURRENT BILLING CYCLE</span>
                    {cb && <StatusBadge status={cb.status} />}
                  </div>
                  {cb ? (
                    <>
                      <div className="rd-bill-period">{cb.billingMonth}</div>
                      <div className="rd-bill-amount-label">{cb.status === "PENDING" ? "AMOUNT DUE" : "AMOUNT DUE (SETTLED)"}</div>
                      <div className="rd-bill-amount">{inr(cb.amountDue)}</div>
                      <div className="rd-bill-meta">
                        <div>
                          <span>USAGE</span>
                          <strong>{kl(cb.consumptionKl)}</strong>
                        </div>
                        <div>
                          <span>BILL TOTAL</span>
                          <strong>{inr(cb.totalAmount)}</strong>
                        </div>
                        <div>
                          <span>{cb.status === "PENDING" ? "DUE DATE" : "DUE DATE"}</span>
                          <strong>
                            {cb.dueDate}
                            {cb.status === "PENDING" && cb.daysUntilDue !== undefined && (
                              <em className={cb.daysUntilDue < 0 ? "late" : ""}>
                                {cb.daysUntilDue < 0 ? ` (${-cb.daysUntilDue}d overdue)` : ` (${cb.daysUntilDue}d left)`}
                              </em>
                            )}
                          </strong>
                        </div>
                      </div>
                      <div className="rd-bill-actions">
                        {cb.status === "PENDING" ? (
                          <button className="rd-btn-primary" onClick={() => navigate("/resident/current-bill")}>
                            💳 Pay {inr(cb.amountDue)}
                          </button>
                        ) : (
                          <button className="rd-btn-ghost" onClick={() => navigate("/resident/payment-history")}>
                            View payment receipts →
                          </button>
                        )}
                        <button className="rd-btn-ghost" onClick={() => navigate("/resident/current-bill")}>
                          Bill details
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rd-bill-empty">No bills have been generated for your apartment yet.</div>
                  )}
                </div>

                <div className="rd-kpis">
                  <div className="rd-kpi">
                    <span>MONTH TO DATE</span>
                    <strong>{kl(k.monthToDateKl)}</strong>
                    <small>
                      {k.changeVsPreviousPct !== undefined ? (
                        <b className={k.changeVsPreviousPct > 0 ? "up" : "down"}>
                          {k.changeVsPreviousPct > 0 ? "▲" : "▼"} {Math.abs(k.changeVsPreviousPct)}%
                        </b>
                      ) : (
                        "—"
                      )}{" "}
                      vs same days last month
                    </small>
                  </div>
                  <div className="rd-kpi">
                    <span>DAILY AVERAGE (30 D)</span>
                    <strong>{kl(k.avgDailyKl30)}</strong>
                    <small>Latest day: {kl(k.latestDayKl)}</small>
                  </div>
                  <div className="rd-kpi">
                    <span>LAST MONTH</span>
                    <strong>{kl(k.previousMonthKl)}</strong>
                    <small>Full-month total</small>
                  </div>
                  <div className="rd-kpi">
                    <span>OUTSTANDING</span>
                    <strong className={k.pendingBills ? "due-text" : ""}>{inr(k.outstandingTotal)}</strong>
                    <small>{k.pendingBills} unpaid bill{k.pendingBills === 1 ? "" : "s"}</small>
                  </div>
                </div>
              </section>

              {/* Trend charts */}
              <section className="rd-charts">
                <div className="rd-card rd-chart-wide">
                  <div className="rd-card-head">
                    <div>
                      <h3>Daily consumption</h3>
                      <p>Last 30 days · dashed line is your 30-day average</p>
                    </div>
                  </div>
                  {hasDaily ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data.daily} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rdDaily" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#079b9b" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#079b9b" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} interval={4} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} unit=" KL" />
                        <Tooltip content={(tp) => <ChartTooltip {...tp} />} />
                        {avg !== undefined && <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="5 4" />}
                        <Area type="monotone" dataKey="consumptionKl" stroke="#079b9b" strokeWidth={2.5} fill="url(#rdDaily)" connectNulls={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="rd-empty">No meter readings recorded in the last 30 days.</div>
                  )}
                </div>

                <div className="rd-card rd-chart-narrow">
                  <div className="rd-card-head">
                    <div>
                      <h3>Monthly consumption</h3>
                      <p>{data.usingBillHistoryForTrend ? "From your billed usage" : "Last 6 months · meter readings"}</p>
                    </div>
                  </div>
                  {hasMonthly ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.monthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} unit=" KL" />
                        <Tooltip content={(tp) => <ChartTooltip {...tp} />} cursor={{ fill: "rgba(7,155,155,0.06)" }} />
                        <Bar dataKey="consumptionKl" fill="#0e7490" radius={[6, 6, 0, 0]} maxBarSize={38} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="rd-empty">No monthly usage data yet.</div>
                  )}
                </div>
              </section>

              {/* Invoices + alerts/tips */}
              <section className="rd-bottom">
                <div className="rd-card rd-invoices">
                  <div className="rd-card-head">
                    <div>
                      <h3>Billing & invoice history</h3>
                      <p>PDF invoices are available for every paid bill</p>
                    </div>
                    <button className="rd-link" onClick={() => navigate("/resident/billing-history")}>
                      View all →
                    </button>
                  </div>
                  {pdfError && <div className="rd-state rd-state-error">⚠️ {pdfError}</div>}
                  {data.invoices.length ? (
                    <div className="rd-table-wrap">
                      <table className="rd-table">
                        <thead>
                          <tr>
                            <th>Invoice</th>
                            <th>Period</th>
                            <th>Usage</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Invoice PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.invoices.slice(0, 6).map((row) => (
                            <tr key={row.billId} className={row.status === "SUPERSEDED" ? "muted" : ""}>
                              <td className="mono">{row.billNumber}</td>
                              <td>{row.billingMonth}</td>
                              <td>{kl(row.consumptionKl)}</td>
                              <td>
                                <strong>{inr(row.totalAmount)}</strong>
                              </td>
                              <td>
                                <StatusBadge status={row.status} />
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {row.invoiceId ? (
                                  <button className="rd-pdf-btn" disabled={downloading === row.billId} onClick={() => downloadInvoice(row)}>
                                    {downloading === row.billId ? "…" : "⬇ PDF"}
                                  </button>
                                ) : row.status === "PENDING" ? (
                                  <button className="rd-link" onClick={() => navigate("/resident/current-bill")}>
                                    Pay to get invoice
                                  </button>
                                ) : (
                                  <span className="rd-none">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rd-empty">No invoices yet.</div>
                  )}
                </div>

                <div className="rd-side">
                  <div className="rd-card">
                    <div className="rd-card-head">
                      <div>
                        <h3>Alerts</h3>
                        <p>Latest activity on your account</p>
                      </div>
                      <button className="rd-link" onClick={() => navigate("/resident/alerts")}>
                        All →
                      </button>
                    </div>
                    {data.alerts.length ? (
                      <ul className="rd-alerts">
                        {data.alerts.slice(0, 5).map((a) => (
                          <li key={a.alertId} className={`sev-${(a.severity || "info").toLowerCase()}`}>
                            <span className="rd-sev" />
                            <div>
                              <strong>{a.title}</strong>
                              <p>{a.message}</p>
                              <small>{timeAgo(a.createdAt)}</small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="rd-empty">No alerts — everything looks normal. 🎉</div>
                    )}
                  </div>

                  <div className="rd-card rd-tips">
                    <div className="rd-card-head">
                      <div>
                        <h3>💧 Water-saving tips</h3>
                        <p>Based on your usage</p>
                      </div>
                    </div>
                    <ul>
                      {data.tips.map((t, i) => (
                        <li key={i} className={`tip-${t.priority}`}>
                          <strong>{t.title}</strong>
                          <p>{t.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Overview;
