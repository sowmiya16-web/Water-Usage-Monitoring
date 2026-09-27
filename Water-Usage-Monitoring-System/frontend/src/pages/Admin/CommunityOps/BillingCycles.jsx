import { useCallback, useEffect, useState } from "react";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, inr, kl, fmtDate } from "./OpsLayout";

const emptyForm = { name: "", startDate: "", endDate: "" };

// Billing-cycle management: create cycles, see what each one produced, close the open one.
export default function BillingCycles() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await communityAdminService.getCycles();
      setCycles(res.data);
    } catch (e) {
      setError(e.message || "Could not load billing cycles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    else if (form.name.trim().length > 50) errs.name = "Max 50 characters.";
    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.endDate) errs.endDate = "End date is required.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) errs.endDate = "End date must be after the start date.";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = await communityAdminService.createCycle({ name: form.name.trim(), startDate: form.startDate, endDate: form.endDate });
      setSuccess(`Cycle "${res.data.name}" created as ${res.data.status}.`);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const close = async (c) => {
    if (!window.confirm(`Close billing cycle "${c.name}"? The next upcoming cycle (if any) becomes the open one.`)) return;
    setError("");
    setSuccess("");
    setClosing(c.cycleId);
    try {
      await communityAdminService.closeCycle(c.cycleId);
      setSuccess(`Cycle "${c.name}" closed.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setClosing(null);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pill = (s) => (s === "OPEN" ? "ok" : s === "UPCOMING" ? "info" : "");
  const open = cycles.find((c) => c.status === "OPEN");

  return (
    <OpsLayout
      activePage="Billing Cycles"
      title="Billing-Cycle Management"
      subtitle="Define billing periods; one cycle is open at a time and bulk purchases are linked to the cycle they fall in"
    >
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>

      <div className="cop-stats">
        <div className="cop-stat">
          <span>Open cycle</span>
          <strong>{open ? open.name : "None"}</strong>
          <small>{open ? `${fmtDate(open.startDate)} – ${fmtDate(open.endDate)}` : "Create a cycle to start billing"}</small>
        </div>
        <div className="cop-stat">
          <span>Consumption in open cycle</span>
          <strong>{open ? kl(open.consumptionKl) : "—"}</strong>
          <small>From meter readings</small>
        </div>
        <div className="cop-stat">
          <span>Billed in open cycle</span>
          <strong>{open ? inr(open.billedAmount) : "—"}</strong>
          <small>{open ? `${open.billCount} bill${open.billCount === 1 ? "" : "s"}` : ""}</small>
        </div>
        <div className="cop-stat">
          <span>Total cycles</span>
          <strong>{cycles.length}</strong>
          <small>{cycles.filter((c) => c.status === "CLOSED").length} closed</small>
        </div>
      </div>

      <form className="cop-card" onSubmit={submit} noValidate>
        <div className="cop-card-head">
          <div>
            <h3>New billing cycle</h3>
            <p>Dates cannot overlap an existing cycle. If a cycle is already open, the new one is queued as upcoming.</p>
          </div>
        </div>
        <div className="cop-form">
          <div className={`cop-field ${fieldErrors.name ? "invalid" : ""}`}>
            <label htmlFor="bc-name">Cycle name</label>
            <input id="bc-name" maxLength={50} placeholder="e.g. October 2026" value={form.name} onChange={set("name")} />
            {fieldErrors.name && <small className="err">{fieldErrors.name}</small>}
          </div>
          <div className={`cop-field ${fieldErrors.startDate ? "invalid" : ""}`}>
            <label htmlFor="bc-start">Start date</label>
            <input id="bc-start" type="date" value={form.startDate} onChange={set("startDate")} />
            {fieldErrors.startDate && <small className="err">{fieldErrors.startDate}</small>}
          </div>
          <div className={`cop-field ${fieldErrors.endDate ? "invalid" : ""}`}>
            <label htmlFor="bc-end">End date</label>
            <input id="bc-end" type="date" min={form.startDate || undefined} value={form.endDate} onChange={set("endDate")} />
            {fieldErrors.endDate && <small className="err">{fieldErrors.endDate}</small>}
          </div>
          <div className="cop-form-actions">
            <button className="cop-btn" disabled={saving}>{saving ? "Creating…" : "Create cycle"}</button>
          </div>
        </div>
      </form>

      <div className="cop-card">
        <div className="cop-card-head">
          <div>
            <h3>All billing cycles</h3>
            <p>Newest first</p>
          </div>
        </div>
        {loading ? (
          <div className="cop-loading">Loading…</div>
        ) : (
          <div className="cop-table-wrap">
            <table className="cop-table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th className="num">Consumption</th>
                  <th className="num">Bulk purchased</th>
                  <th className="num">Bills</th>
                  <th className="num">Billed amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.cycleId} className={c.status === "OPEN" ? "current-row" : ""}>
                    <td><strong>{c.name}</strong></td>
                    <td>{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</td>
                    <td><span className={`cop-pill ${pill(c.status)}`}>{c.status}</span></td>
                    <td className="num">{kl(c.consumptionKl)}</td>
                    <td className="num">{kl(c.purchasedKl)}</td>
                    <td className="num">{c.billCount}</td>
                    <td className="num">{inr(c.billedAmount)}</td>
                    <td className="num">
                      {c.status === "OPEN" && (
                        <button className="cop-btn danger small" disabled={closing === c.cycleId} onClick={() => close(c)}>
                          {closing === c.cycleId ? "Closing…" : "Close cycle"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!cycles.length && (
                  <tr>
                    <td colSpan={8} className="cop-empty">No billing cycles yet — create the first one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OpsLayout>
  );
}
