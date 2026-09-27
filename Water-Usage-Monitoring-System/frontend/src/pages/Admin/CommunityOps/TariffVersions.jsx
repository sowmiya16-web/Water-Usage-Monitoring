import { useCallback, useEffect, useState } from "react";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, inr } from "./OpsLayout";

const FIELDS = [
  { key: "tier1LimitKl", label: "Tier 1 limit (KL)", step: "0.1" },
  { key: "tier1RatePerKl", label: "Tier 1 rate (₹/KL)", step: "0.01" },
  { key: "tier2LimitKl", label: "Tier 2 limit (KL)", step: "0.1" },
  { key: "tier2RatePerKl", label: "Tier 2 rate (₹/KL)", step: "0.01" },
  { key: "tier3RatePerKl", label: "Tier 3 rate (₹/KL)", step: "0.01" },
  { key: "fixedBaseCharge", label: "Fixed base charge (₹)", step: "0.01" },
  { key: "commonWaterCharge", label: "Common water charge (₹)", step: "0.01" },
];

const fmt = (t) => (t.effectiveFrom ? new Date(t.effectiveFrom).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

// Tariff management with append-only version history: saving always creates a new version.
export default function TariffVersions() {
  const [view, setView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await communityAdminService.getTariffs();
      setView(res.data);
      setForm((f) => f || (res.data.current ? { planName: res.data.current.planName, ...Object.fromEntries(FIELDS.map((x) => [x.key, res.data.current[x.key]])) } : null));
    } catch (e) {
      setError(e.message || "Could not load tariffs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = view?.current;
  const history = view?.history || [];

  const validate = () => {
    const errs = {};
    if (!form.planName?.trim()) errs.planName = "Plan name is required.";
    FIELDS.forEach(({ key }) => {
      const v = form[key];
      if (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) || Number(v) < 0) errs[key] = "Enter a number (0 or more).";
    });
    if (!errs.tier1LimitKl && Number(form.tier1LimitKl) <= 0) errs.tier1LimitKl = "Must be greater than 0.";
    if (!errs.tier1LimitKl && !errs.tier2LimitKl && Number(form.tier2LimitKl) <= Number(form.tier1LimitKl))
      errs.tier2LimitKl = "Must be greater than the Tier 1 limit.";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    if (!window.confirm("Save these rates as a new tariff version? The current version stays in the history and is never overwritten.")) return;
    setSaving(true);
    try {
      const payload = { planName: form.planName.trim(), buildingId: current?.buildingId ?? 1 };
      FIELDS.forEach(({ key }) => (payload[key] = Number(form[key])));
      const res = await communityAdminService.createTariff(payload);
      setSuccess(res.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changed = (key) => current && form && Number(form[key]) !== Number(current[key]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <OpsLayout
      activePage="Tariff Versions"
      title="Tariff Versions"
      subtitle="Every change creates a new dated version — previous tariffs are never overwritten"
    >
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>

      {loading && <div className="cop-loading">Loading tariffs…</div>}

      {!loading && (
        <div className="cop-grid-2">
          <div className="cop-card">
            <div className="cop-card-head">
              <div>
                <h3>Version history</h3>
                <p>{history.length} version{history.length === 1 ? "" : "s"} · newest first</p>
              </div>
            </div>
            <div className="cop-table-wrap">
              <table className="cop-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Effective from</th>
                    <th className="num">T1 limit / rate</th>
                    <th className="num">T2 limit / rate</th>
                    <th className="num">T3 rate</th>
                    <th className="num">Base</th>
                    <th className="num">Common</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t, i) => {
                    const older = history[i + 1];
                    const d = (k) => (older && Number(older[k]) !== Number(t[k]) ? "cop-diff" : "");
                    return (
                      <tr key={t.planId} className={i === 0 ? "current-row" : ""}>
                        <td>
                          <strong>v{t.version}</strong> {i === 0 && <span className="cop-pill ok">Current</span>}
                          <div style={{ fontSize: 11, color: "#64748b" }}>{t.planName}</div>
                        </td>
                        <td>{fmt(t)}</td>
                        <td className="num">
                          <span className={d("tier1LimitKl")}>{t.tier1LimitKl}</span> / <span className={d("tier1RatePerKl")}>{inr(t.tier1RatePerKl)}</span>
                        </td>
                        <td className="num">
                          <span className={d("tier2LimitKl")}>{t.tier2LimitKl}</span> / <span className={d("tier2RatePerKl")}>{inr(t.tier2RatePerKl)}</span>
                        </td>
                        <td className={`num ${d("tier3RatePerKl")}`}>{inr(t.tier3RatePerKl)}</td>
                        <td className={`num ${d("fixedBaseCharge")}`}>{inr(t.fixedBaseCharge)}</td>
                        <td className={`num ${d("commonWaterCharge")}`}>{inr(t.commonWaterCharge)}</td>
                      </tr>
                    );
                  })}
                  {!history.length && (
                    <tr>
                      <td colSpan={7} className="cop-empty">No tariff saved yet — the default plan applies until you save one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <small style={{ color: "#64748b", display: "block", marginTop: 10 }}>
              <span className="cop-diff">Highlighted</span> values changed compared with the version before them.
            </small>
          </div>

          <form className="cop-card" onSubmit={submit} noValidate>
            <div className="cop-card-head">
              <div>
                <h3>New version{current ? ` (v${current.version + 1})` : ""}</h3>
                <p>Edit the rates below and save. Bills already issued keep the rate they were created with.</p>
              </div>
            </div>
            {form ? (
              <div className="cop-form" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className={`cop-field wide ${fieldErrors.planName ? "invalid" : ""}`}>
                  <label htmlFor="tv-name">Plan name</label>
                  <input id="tv-name" maxLength={100} value={form.planName} onChange={set("planName")} />
                  {fieldErrors.planName && <small className="err">{fieldErrors.planName}</small>}
                </div>
                {FIELDS.map((f) => (
                  <div key={f.key} className={`cop-field ${fieldErrors[f.key] ? "invalid" : ""}`}>
                    <label htmlFor={`tv-${f.key}`}>{f.label}</label>
                    <input id={`tv-${f.key}`} type="number" min="0" step={f.step} value={form[f.key]} onChange={set(f.key)} />
                    {fieldErrors[f.key] ? (
                      <small className="err">{fieldErrors[f.key]}</small>
                    ) : (
                      changed(f.key) && <small className="cop-diff">was {current[f.key]}</small>
                    )}
                  </div>
                ))}
                <div className="cop-form-actions">
                  <button className="cop-btn" disabled={saving}>{saving ? "Saving…" : "Save as new version"}</button>
                </div>
              </div>
            ) : (
              <div className="cop-empty">No current tariff to base a new version on.</div>
            )}
          </form>
        </div>
      )}
    </OpsLayout>
  );
}
