import { useCallback, useEffect, useState } from "react";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, inr, kl, fmtDate, todayIso } from "./OpsLayout";

const emptyForm = { supplierName: "", deliveryDate: todayIso(), volumeKl: "", totalCost: "", waterSource: "", notes: "" };
const SOURCES = ["Tanker", "Municipal supply", "Borewell", "Other"];

// Bulk-water purchase entry and history.
export default function BulkPurchases() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await communityAdminService.getPurchases();
      setData(res.data);
    } catch (e) {
      setError(e.message || "Could not load purchases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const vol = Number(form.volumeKl);
  const cost = Number(form.totalCost);
  const unit = vol > 0 && cost > 0 ? cost / vol : null;

  const validate = () => {
    const errs = {};
    if (!form.supplierName.trim()) errs.supplierName = "Supplier is required.";
    if (!form.deliveryDate) errs.deliveryDate = "Delivery date is required.";
    else if (form.deliveryDate > todayIso()) errs.deliveryDate = "Date cannot be in the future.";
    if (form.volumeKl === "" || Number.isNaN(vol) || vol <= 0) errs.volumeKl = "Volume must be greater than 0.";
    if (form.totalCost === "" || Number.isNaN(cost) || cost <= 0) errs.totalCost = "Cost must be greater than 0.";
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
      await communityAdminService.recordPurchase({
        supplierName: form.supplierName.trim(),
        deliveryDate: form.deliveryDate,
        volumeKl: vol,
        totalCost: cost,
        waterSource: form.waterSource || null,
        notes: form.notes.trim() || null,
      });
      setSuccess(`Recorded ${kl(vol)} from ${form.supplierName.trim()}.`);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const s = data?.summary;

  return (
    <OpsLayout
      activePage="Bulk Water Purchases"
      title="Bulk Water Purchases"
      subtitle="Record tanker and municipal deliveries and review purchase history and unit costs"
    >
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>

      <div className="cop-stats">
        <div className="cop-stat"><span>Purchases</span><strong>{s?.count ?? "—"}</strong><small>All time</small></div>
        <div className="cop-stat"><span>Total volume</span><strong>{s ? kl(s.totalVolumeKl) : "—"}</strong><small>Purchased in bulk</small></div>
        <div className="cop-stat"><span>Total cost</span><strong>{s ? inr(s.totalCost) : "—"}</strong><small>Across all suppliers</small></div>
        <div className="cop-stat"><span>Average unit cost</span><strong>{s ? inr(s.avgUnitCost) : "—"}</strong><small>Per KL</small></div>
      </div>

      <form className="cop-card" onSubmit={submit} noValidate>
        <div className="cop-card-head">
          <div>
            <h3>Record a purchase</h3>
            <p>The purchase is linked to the billing cycle that contains the delivery date</p>
          </div>
        </div>
        <div className="cop-form">
          <div className={`cop-field ${fieldErrors.supplierName ? "invalid" : ""}`}>
            <label htmlFor="bp-supplier">Supplier</label>
            <input id="bp-supplier" maxLength={100} value={form.supplierName} onChange={set("supplierName")} />
            {fieldErrors.supplierName && <small className="err">{fieldErrors.supplierName}</small>}
          </div>
          <div className={`cop-field ${fieldErrors.deliveryDate ? "invalid" : ""}`}>
            <label htmlFor="bp-date">Delivery date</label>
            <input id="bp-date" type="date" max={todayIso()} value={form.deliveryDate} onChange={set("deliveryDate")} />
            {fieldErrors.deliveryDate && <small className="err">{fieldErrors.deliveryDate}</small>}
          </div>
          <div className="cop-field">
            <label htmlFor="bp-source">Water source</label>
            <select id="bp-source" value={form.waterSource} onChange={set("waterSource")}>
              <option value="">Not specified</option>
              {SOURCES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className={`cop-field ${fieldErrors.volumeKl ? "invalid" : ""}`}>
            <label htmlFor="bp-vol">Volume (KL)</label>
            <input id="bp-vol" type="number" min="0" step="0.01" value={form.volumeKl} onChange={set("volumeKl")} />
            {fieldErrors.volumeKl && <small className="err">{fieldErrors.volumeKl}</small>}
          </div>
          <div className={`cop-field ${fieldErrors.totalCost ? "invalid" : ""}`}>
            <label htmlFor="bp-cost">Total cost (₹)</label>
            <input id="bp-cost" type="number" min="0" step="0.01" value={form.totalCost} onChange={set("totalCost")} />
            {fieldErrors.totalCost ? <small className="err">{fieldErrors.totalCost}</small> : <small>{unit ? `Unit cost ≈ ${inr(unit)} / KL` : "Unit cost is calculated for you"}</small>}
          </div>
          <div className="cop-field wide">
            <label htmlFor="bp-notes">Notes (optional)</label>
            <textarea id="bp-notes" rows={2} maxLength={2000} value={form.notes} onChange={set("notes")} />
          </div>
          <div className="cop-form-actions">
            <button className="cop-btn" disabled={saving}>{saving ? "Saving…" : "Record purchase"}</button>
          </div>
        </div>
      </form>

      <div className="cop-card">
        <div className="cop-card-head">
          <div>
            <h3>Purchase history</h3>
            <p>Most recent deliveries first</p>
          </div>
        </div>
        {loading ? (
          <div className="cop-loading">Loading…</div>
        ) : (
          <div className="cop-table-wrap">
            <table className="cop-table">
              <thead>
                <tr>
                  <th>Delivered</th>
                  <th>Supplier</th>
                  <th>Source</th>
                  <th className="num">Volume</th>
                  <th className="num">Total cost</th>
                  <th className="num">Unit cost</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(data?.purchases || []).map((p) => (
                  <tr key={p.purchaseId}>
                    <td>{fmtDate(p.deliveryDate)}</td>
                    <td><strong>{p.supplierName}</strong></td>
                    <td>{p.waterSource || "—"}</td>
                    <td className="num">{kl(p.volumeKl)}</td>
                    <td className="num">{inr(p.totalCost)}</td>
                    <td className="num">{p.unitCost !== undefined ? inr(p.unitCost) : "—"}</td>
                    <td style={{ maxWidth: 220, color: "#64748b" }}>{p.notes || ""}</td>
                  </tr>
                ))}
                {!data?.purchases?.length && (
                  <tr>
                    <td colSpan={7} className="cop-empty">No bulk purchases recorded yet.</td>
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
