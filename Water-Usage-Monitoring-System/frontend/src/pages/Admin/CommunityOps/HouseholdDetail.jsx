import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, ChartTooltip, inr, kl, fmtDate, todayIso } from "./OpsLayout";
import { ConfirmModal, HouseholdFormModal, ResidentFormModal } from "./HouseholdModals";
import { meterPill } from "./Households";

const num2 = (n) => (n === undefined || n === null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }));
const arrow = (p) => (p > 0 ? "▲ " : p < 0 ? "▼ " : "");
const billPill = (s) => (s === "PAID" ? "ok" : s === "PENDING" ? "warn" : s === "MIXED" ? "info" : "");

// One household: residents, meter, complete monthly usage history, readings, comparison and bills.
export default function HouseholdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [months, setMonths] = useState(12);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState("");
  const [residentModal, setResidentModal] = useState(null); // null | "new" | ResidentRow
  const [removing, setRemoving] = useState(null);
  const [rmBusy, setRmBusy] = useState(false);
  const [rmError, setRmError] = useState("");
  const [reading, setReading] = useState({ readingDate: todayIso(), currentReading: "" });
  const [readingErr, setReadingErr] = useState("");
  const [savingReading, setSavingReading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await communityAdminService.getHousehold(id, months);
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e.message || "Could not load this household.");
    } finally {
      setLoading(false);
    }
  }, [id, months]);

  useEffect(() => {
    load();
  }, [load]);

  const h = data?.household;
  const meter = h?.meter;

  const saveReading = async (e) => {
    e.preventDefault();
    setReadingErr("");
    setSuccess("");
    const cur = Number(reading.currentReading);
    if (!reading.readingDate) return setReadingErr("Reading date is required.");
    if (reading.readingDate > todayIso()) return setReadingErr("Date cannot be in the future.");
    if (reading.currentReading === "" || Number.isNaN(cur) || cur < 0) return setReadingErr("Enter a valid reading (0 or more).");
    setSavingReading(true);
    try {
      const res = await communityAdminService.addReading(meter.meterId, { readingDate: reading.readingDate, currentReading: cur });
      setSuccess(`Reading saved — consumption ${kl(res.data?.consumptionKl)}.`);
      setReading({ readingDate: todayIso(), currentReading: "" });
      await load();
    } catch (err) {
      setReadingErr(err.message);
    } finally {
      setSavingReading(false);
    }
  };

  const confirmDelete = async () => {
    setDelBusy(true);
    setDelError("");
    try {
      await communityAdminService.deleteHousehold(h.apartmentId);
      navigate("/admin/households", { replace: true });
    } catch (e) {
      setDelError(e.message);
      setDelBusy(false);
    }
  };

  const confirmRemove = async () => {
    setRmBusy(true);
    setRmError("");
    try {
      await communityAdminService.deleteResident(h.apartmentId, removing.residentId);
      setSuccess(`${removing.fullName} was removed.`);
      setRemoving(null);
      await load();
    } catch (e) {
      setRmError(e.message);
    } finally {
      setRmBusy(false);
    }
  };

  const chartData = (data?.history || []).map((m) => ({ name: m.label, household: m.consumptionKl, community: m.communityAvgKl }));
  const cmp = data?.comparison;

  return (
    <OpsLayout
      activePage="Households"
      badge="HOUSEHOLD"
      title={h ? `${h.apartmentNumber} · ${h.buildingName}` : "Household"}
      subtitle={h ? `Floor ${h.floorNumber} · ${h.occupancyStatus === "OCCUPIED" ? "Occupied" : "Vacant"}` : ""}
      actions={
        <>
          <button type="button" className="cop-btn ghost" onClick={() => navigate("/admin/households")}>← All households</button>
          {h && <button type="button" className="cop-btn ghost" onClick={() => setEditing(true)}>Edit</button>}
          {h && <button type="button" className="cop-btn danger" onClick={() => { setDelError(""); setDeleting(true); }}>Delete</button>}
        </>
      }
    >
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>
      {loading && !data && <div className="cop-loading">Loading household…</div>}

      {data && h && (
        <>
          <div className="cop-stats">
            <div className="cop-stat"><span>This month</span><strong>{kl(h.currentKl)}</strong><small>{h.readingDays} reading day{h.readingDays === 1 ? "" : "s"}</small></div>
            <div className="cop-stat">
              <span>Previous month</span><strong>{kl(h.previousKl)}</strong>
              <small>{h.changePct === undefined || h.changePct === null ? "No comparison yet" : (
                <span className={h.changePct > 0 ? "cop-up" : "cop-down"}>{h.changePct > 0 ? "▲" : "▼"} {Math.abs(h.changePct)}% (same days)</span>)}</small>
            </div>
            <div className="cop-stat"><span>Community average</span><strong>{kl(cmp.communityAvgKl)}</strong>
              <small>{cmp.vsCommunityPct === undefined || cmp.vsCommunityPct === null ? "—" : `${cmp.vsCommunityPct > 0 ? "+" : ""}${cmp.vsCommunityPct}% vs average`}</small></div>
            <div className="cop-stat"><span>Usage rank</span><strong>{cmp.rank ? `#${cmp.rank}` : "—"}</strong><small>{cmp.rank ? `of ${cmp.outOf} households` : cmp.verdict}</small></div>
            <div className="cop-stat"><span>Billed / paid</span><strong>{inr(data.totalPaid)}</strong><small>of {inr(data.totalBilled)} billed</small></div>
            <div className="cop-stat"><span>Pending bills</span><strong>{h.pendingBills}</strong><small>{h.pendingBills ? inr(h.pendingAmount) : "Nothing due"}</small></div>
          </div>
          <Notice kind={cmp.vsCommunityPct > 50 ? "error" : "info"}>{cmp.verdict}</Notice>

          <div className="cop-card">
            <div className="cop-card-head">
              <div>
                <h3>Monthly water-usage history</h3>
                <p>This household against the community average per household</p>
              </div>
              <div className="cop-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <label htmlFor="hd-months">Show</label>
                <select id="hd-months" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                  <option value={6}>Last 6 months</option>
                  <option value={12}>Last 12 months</option>
                  <option value={24}>Last 24 months</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5edf0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} unit=" KL" width={64} />
                <Tooltip content={(tp) => <ChartTooltip {...tp} />} cursor={{ fill: "rgba(7,155,155,0.06)" }} />
                <Legend />
                <Bar dataKey="community" name="Community average" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="household" name={`${h.apartmentNumber}`} fill="#079b9b" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
            <div className="cop-table-wrap" style={{ marginTop: 12 }}>
              <table className="cop-table">
                <thead>
                  <tr>
                    <th>Month</th><th className="num">Consumption</th><th className="num">Reading days</th><th className="num">Avg / day</th>
                    <th className="num">Peak day</th><th className="num">Community avg</th><th className="num">vs average</th><th className="num">Billed</th><th>Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.history].reverse().map((m) => (
                    <tr key={m.month}>
                      <td><strong>{m.month}</strong></td>
                      <td className="num">{m.readingDays ? kl(m.consumptionKl) : "—"}</td>
                      <td className="num">{m.readingDays}</td>
                      <td className="num">{m.readingDays ? kl(m.avgDailyKl) : "—"}</td>
                      <td className="num">{m.readingDays ? kl(m.peakDayKl) : "—"}</td>
                      <td className="num">{m.communityAvgKl ? kl(m.communityAvgKl) : "—"}</td>
                      <td className="num">{m.vsCommunityPct === undefined || m.vsCommunityPct === null ? "—" : (
                        <span className={m.vsCommunityPct > 0 ? "cop-up" : m.vsCommunityPct < 0 ? "cop-down" : ""}>{arrow(m.vsCommunityPct)}{Math.abs(m.vsCommunityPct)}%</span>)}</td>
                      <td className="num">{m.billedAmount ? inr(m.billedAmount) : "—"}</td>
                      <td>{m.billStatus ? <span className={`cop-pill ${billPill(m.billStatus)}`}>{m.billStatus}</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cop-grid-eq">
            <div className="cop-card">
              <div className="cop-card-head">
                <div><h3>Residents</h3><p>Only the primary resident has a portal login</p></div>
                <button type="button" className="cop-btn small" onClick={() => setResidentModal("new")}>+ Add resident</button>
              </div>
              {h.residents.length ? (
                <ul className="cop-list">
                  {h.residents.map((r) => (
                    <li key={r.residentId}>
                      <div>
                        <strong>{r.fullName}</strong>{" "}
                        {r.primary && <span className="cop-pill info">Primary · login</span>}
                        <div className="cop-sub">{r.email}{r.phone ? ` · ${r.phone}` : ""}</div>
                        <div className="cop-sub">Registered {fmtDate(r.registeredAt)}</div>
                      </div>
                      <div className="cop-actions">
                        <button type="button" className="cop-btn ghost small" onClick={() => setResidentModal(r)}>Edit</button>{" "}
                        <button type="button" className="cop-btn danger small" onClick={() => { setRmError(""); setRemoving(r); }}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <div className="cop-empty">No residents registered for this household.</div>}
            </div>

            <div className="cop-card">
              <div className="cop-card-head"><div><h3>Water meter</h3><p>Smart meter installed at this household</p></div></div>
              {meter ? (
                <>
                  <dl className="cop-dl">
                    <div><dt>Serial</dt><dd className="cop-mono">{meter.serialNumber}</dd></div>
                    <div><dt>Status</dt><dd><span className={`cop-pill ${meterPill(meter.status)}`}>{meter.status}</span></dd></div>
                    <div><dt>Battery</dt><dd>{meter.battery ?? "—"}%</dd></div>
                    <div><dt>Signal</dt><dd>{meter.signal ?? "—"}%</dd></div>
                    <div><dt>Last reading</dt><dd>{fmtDate(meter.lastReadingDate)}</dd></div>
                  </dl>
                  <form className="cop-inline-form" onSubmit={saveReading} noValidate>
                    <strong>Add a reading</strong>
                    <div className="cop-form">
                      <div className="cop-field"><label htmlFor="hd-date">Date</label>
                        <input id="hd-date" type="date" max={todayIso()} value={reading.readingDate} onChange={(e) => setReading((r) => ({ ...r, readingDate: e.target.value }))} /></div>
                      <div className="cop-field"><label htmlFor="hd-cur">Current reading (KL)</label>
                        <input id="hd-cur" type="number" min="0" step="any" value={reading.currentReading} onChange={(e) => setReading((r) => ({ ...r, currentReading: e.target.value }))} /></div>
                    </div>
                    {readingErr && <Notice kind="error">{readingErr}</Notice>}
                    <button type="submit" className="cop-btn small" disabled={savingReading}>{savingReading ? "Saving…" : "Save reading"}</button>
                  </form>
                </>
              ) : (
                <div className="cop-empty">No meter yet. Use “Edit” and enter a meter serial to add one.</div>
              )}
            </div>
          </div>

          <div className="cop-grid-eq">
            <div className="cop-card">
              <div className="cop-card-head"><div><h3>Recent readings</h3><p>Latest 30 entries for this meter</p></div></div>
              <div className="cop-table-wrap" style={{ maxHeight: 340, overflowY: "auto" }}>
                <table className="cop-table">
                  <thead><tr><th>Date</th><th className="num">Previous</th><th className="num">Current</th><th className="num">Consumption</th></tr></thead>
                  <tbody>
                    {data.recentReadings.map((r) => (
                      <tr key={r.usageId}><td>{fmtDate(r.readingDate)}</td><td className="num">{num2(r.previousReading)}</td><td className="num">{num2(r.currentReading)}</td><td className="num"><strong>{kl(r.consumptionKl)}</strong></td></tr>
                    ))}
                    {!data.recentReadings.length && <tr><td colSpan={4} className="cop-empty">No readings recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="cop-card">
              <div className="cop-card-head"><div><h3>Bills</h3><p>Most recent bills for this household</p></div></div>
              <div className="cop-table-wrap" style={{ maxHeight: 340, overflowY: "auto" }}>
                <table className="cop-table">
                  <thead><tr><th>Bill</th><th>Month</th><th className="num">Usage</th><th className="num">Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.bills.map((b) => (
                      <tr key={b.billId}>
                        <td className="cop-mono">{b.billNumber}</td><td>{b.billingMonth}</td><td className="num">{kl(b.consumptionKl)}</td>
                        <td className="num">{inr(b.totalAmount)}</td><td><span className={`cop-pill ${billPill(b.status)}`}>{b.status}</span></td>
                      </tr>
                    ))}
                    {!data.bills.length && <tr><td colSpan={5} className="cop-empty">No bills yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {editing && h && (
        <HouseholdFormModal
          household={h}
          buildings={[h.buildingName]}
          onClose={() => setEditing(false)}
          onSaved={async (_d, msg) => { setEditing(false); setSuccess(msg); await load(); }}
        />
      )}
      {residentModal && h && (
        <ResidentFormModal
          household={h}
          resident={residentModal === "new" ? null : residentModal}
          onClose={() => setResidentModal(null)}
          onSaved={async (msg) => { setResidentModal(null); setSuccess(msg || "Saved."); await load(); }}
        />
      )}
      {removing && (
        <ConfirmModal title={`Remove ${removing.fullName}?`} confirmLabel="Remove resident" danger busy={rmBusy} error={rmError}
          onConfirm={confirmRemove} onCancel={() => setRemoving(null)}>
          {removing.primary
            ? "This is the primary resident. Removing them also deletes their portal login, and the household is marked Vacant if nobody else is registered."
            : "This removes them from the household. The household's meter and history are not affected."}
        </ConfirmModal>
      )}
      {deleting && h && (
        <ConfirmModal title={`Delete household ${h.apartmentNumber}?`} confirmLabel="Delete household" danger busy={delBusy} error={delError}
          onConfirm={confirmDelete} onCancel={() => setDeleting(false)}>
          This permanently removes the household, its meter, all readings and its residents (including portal logins). Households with bills can't be deleted — mark them Vacant instead.
        </ConfirmModal>
      )}
    </OpsLayout>
  );
}
