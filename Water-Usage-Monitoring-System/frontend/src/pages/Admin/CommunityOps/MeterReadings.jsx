import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, kl, fmtDate, todayIso } from "./OpsLayout";

const emptyForm = { meterId: "", readingDate: todayIso(), currentReading: "", previousReading: "" };

// Water-meter reading entry, CSV upload and reading history.
export default function MeterReadings() {
  const location = useLocation();
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [filterMeter, setFilterMeter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([
        communityAdminService.getMeters(),
        communityAdminService.getReadings(filterMeter || undefined, 30),
      ]);
      setMeters(m.data);
      setReadings(r.data);
      setError("");
    } catch (e) {
      setError(e.message || "Could not load meters.");
    } finally {
      setLoading(false);
    }
  }, [filterMeter]);

  useEffect(() => {
    load();
  }, [load]);

  // Arriving from Water Meters (?serial=WM-...) preselects that meter for entry and history
  useEffect(() => {
    const serial = new URLSearchParams(location.search).get("serial");
    const m = serial && meters.find((x) => x.serialNumber === serial);
    if (m) {
      setForm((f) => (f.meterId ? f : { ...f, meterId: String(m.meterId) }));
      setFilterMeter((f) => f || String(m.meterId));
    }
  }, [location.search, meters]);

  const selected = meters.find((m) => String(m.meterId) === String(form.meterId));

  const validate = () => {
    const errs = {};
    if (!form.meterId) errs.meterId = "Choose a meter.";
    if (!form.readingDate) errs.readingDate = "Reading date is required.";
    else if (form.readingDate > todayIso()) errs.readingDate = "Date cannot be in the future.";
    const cur = Number(form.currentReading);
    if (form.currentReading === "" || Number.isNaN(cur) || cur < 0) errs.currentReading = "Enter a valid reading (0 or more).";
    if (form.previousReading !== "") {
      const prev = Number(form.previousReading);
      if (Number.isNaN(prev) || prev < 0) errs.previousReading = "Previous reading must be 0 or more.";
      else if (!errs.currentReading && cur < prev) errs.currentReading = "Cannot be lower than the previous reading.";
    } else if (selected?.lastReading !== undefined && !errs.currentReading && cur < selected.lastReading) {
      errs.currentReading = `Cannot be lower than the last reading (${selected.lastReading}).`;
    }
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = await communityAdminService.addReading(form.meterId, {
        readingDate: form.readingDate,
        currentReading: Number(form.currentReading),
        ...(form.previousReading !== "" ? { previousReading: Number(form.previousReading) } : {}),
      });
      setSuccess(`Reading saved for ${res.data?.serialNumber || "meter"} — consumption ${kl(res.data?.consumptionKl)}.`);
      setForm({ ...emptyForm, meterId: form.meterId });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const upload = async () => {
    setSuccess("");
    setError("");
    setCsvResult(null);
    if (!file) return setError("Choose a .csv file first.");
    if (!file.name.toLowerCase().endsWith(".csv")) return setError("Only .csv files are accepted.");
    if (file.size > 5 * 1024 * 1024) return setError("File is larger than 5 MB.");
    setUploading(true);
    try {
      const res = await communityAdminService.uploadReadingsCsv(file);
      setCsvResult(res.data);
      setSuccess(res.message);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const statusPill = (s) => (s === "ONLINE" ? "ok" : s === "ALERT" ? "bad" : "warn");

  return (
    <OpsLayout
      activePage="Meter Readings"
      title="Meter Readings"
      subtitle="Enter or upload water-meter readings and review the reading history"
    >
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>

      <div className="cop-grid-eq">
        <form className="cop-card" onSubmit={submit} noValidate>
          <div className="cop-card-head">
            <div>
              <h3>Enter a reading</h3>
              <p>Consumption is calculated from the previous reading automatically</p>
            </div>
          </div>
          <div className="cop-form">
            <div className={`cop-field wide ${fieldErrors.meterId ? "invalid" : ""}`}>
              <label htmlFor="mr-meter">Meter</label>
              <select id="mr-meter" value={form.meterId} onChange={set("meterId")}>
                <option value="">Select a meter…</option>
                {meters.map((m) => (
                  <option key={m.meterId} value={m.meterId}>
                    {m.serialNumber} — {m.apartment ? `Apt ${m.apartment}` : "unassigned"}
                  </option>
                ))}
              </select>
              {fieldErrors.meterId && <small className="err">{fieldErrors.meterId}</small>}
              {selected && (
                <small>
                  Last reading: {selected.lastReading !== undefined ? `${selected.lastReading} on ${fmtDate(selected.lastReadingDate)}` : "none yet"}
                </small>
              )}
            </div>
            <div className={`cop-field ${fieldErrors.readingDate ? "invalid" : ""}`}>
              <label htmlFor="mr-date">Reading date</label>
              <input id="mr-date" type="date" max={todayIso()} value={form.readingDate} onChange={set("readingDate")} />
              {fieldErrors.readingDate && <small className="err">{fieldErrors.readingDate}</small>}
            </div>
            <div className={`cop-field ${fieldErrors.currentReading ? "invalid" : ""}`}>
              <label htmlFor="mr-cur">Current reading (KL)</label>
              <input id="mr-cur" type="number" step="0.01" min="0" value={form.currentReading} onChange={set("currentReading")} />
              {fieldErrors.currentReading && <small className="err">{fieldErrors.currentReading}</small>}
            </div>
            <div className={`cop-field ${fieldErrors.previousReading ? "invalid" : ""}`}>
              <label htmlFor="mr-prev">Previous reading (optional)</label>
              <input id="mr-prev" type="number" step="0.01" min="0" placeholder="Auto" value={form.previousReading} onChange={set("previousReading")} />
              {fieldErrors.previousReading && <small className="err">{fieldErrors.previousReading}</small>}
            </div>
            <div className="cop-form-actions">
              <button className="cop-btn" disabled={saving}>{saving ? "Saving…" : "Save reading"}</button>
            </div>
          </div>
        </form>

        <div className="cop-card">
          <div className="cop-card-head">
            <div>
              <h3>Upload readings (CSV)</h3>
              <p>
                Columns: <span className="cop-mono">meter, current reading, date (YYYY-MM-DD), previous reading (optional)</span>. The
                meter can be its serial number or id.
              </p>
            </div>
          </div>
          <div className="cop-form">
            <div className="cop-field wide">
              <label htmlFor="mr-file">CSV file</label>
              <input id="mr-file" ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <small>Rows that fail validation are skipped and listed below; valid rows are still imported.</small>
            </div>
            <div className="cop-form-actions">
              <button type="button" className="cop-btn" disabled={!file || uploading} onClick={upload}>
                {uploading ? "Uploading…" : "Upload & import"}
              </button>
            </div>
          </div>
          {csvResult && (
            <div style={{ marginTop: 14 }}>
              <span className="cop-pill ok">{csvResult.imported} imported</span>{" "}
              <span className={`cop-pill ${csvResult.errors.length ? "bad" : ""}`}>{csvResult.errors.length} rejected</span>{" "}
              <span className="cop-pill">{csvResult.rows} rows</span>
              {csvResult.errors.length > 0 && (
                <ul className="cop-errlist">
                  {csvResult.errors.map((er, i) => (
                    <li key={i}>
                      Line {er.line}: {er.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="cop-card">
        <div className="cop-card-head">
          <div>
            <h3>Registered meters</h3>
            <p>{meters.length} meter{meters.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        {loading ? (
          <div className="cop-loading">Loading…</div>
        ) : (
          <div className="cop-table-wrap">
            <table className="cop-table">
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Apartment</th>
                  <th>Status</th>
                  <th className="num">Battery</th>
                  <th className="num">Signal</th>
                  <th className="num">Last reading</th>
                  <th>Last date</th>
                </tr>
              </thead>
              <tbody>
                {meters.map((m) => (
                  <tr key={m.meterId}>
                    <td className="cop-mono">{m.serialNumber}</td>
                    <td>{m.apartment ? `${m.apartment}${m.building ? `, ${m.building}` : ""}` : "—"}</td>
                    <td><span className={`cop-pill ${statusPill(m.status)}`}>{m.status}</span></td>
                    <td className="num">{m.battery ?? "—"}%</td>
                    <td className="num">{m.signal ?? "—"}%</td>
                    <td className="num">{m.lastReading ?? "—"}</td>
                    <td>{fmtDate(m.lastReadingDate)}</td>
                  </tr>
                ))}
                {!meters.length && (
                  <tr>
                    <td colSpan={7} className="cop-empty">No meters registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cop-card">
        <div className="cop-card-head">
          <div>
            <h3>Reading history</h3>
            <p>Most recent 30 readings</p>
          </div>
          <div className="cop-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label htmlFor="mr-filter">Meter</label>
            <select id="mr-filter" value={filterMeter} onChange={(e) => setFilterMeter(e.target.value)}>
              <option value="">All meters</option>
              {meters.map((m) => (
                <option key={m.meterId} value={m.meterId}>{m.serialNumber}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cop-table-wrap">
          <table className="cop-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meter</th>
                <th>Apartment</th>
                <th className="num">Previous</th>
                <th className="num">Current</th>
                <th className="num">Consumption</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.usageId}>
                  <td>{fmtDate(r.readingDate)}</td>
                  <td className="cop-mono">{r.serialNumber}</td>
                  <td>{r.apartment || "—"}</td>
                  <td className="num">{r.previousReading}</td>
                  <td className="num">{r.currentReading}</td>
                  <td className="num">
                    <strong>{kl(r.consumptionKl)}</strong> {r.consumptionKl > 5 && <span className="cop-pill bad">High</span>}
                  </td>
                </tr>
              ))}
              {!readings.length && (
                <tr>
                  <td colSpan={6} className="cop-empty">No readings recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </OpsLayout>
  );
}
