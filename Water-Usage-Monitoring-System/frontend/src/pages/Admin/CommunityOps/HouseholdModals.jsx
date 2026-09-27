import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import communityAdminService from "../../../services/communityAdminService";
import { Notice } from "./OpsLayout";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

function Modal({ title, subtitle, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector("input, select, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="cop-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`cop-modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="cop-modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="cop-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, error, hint, wide, children }) {
  const id = useId();
  const kids = Children.toArray(children).map((c, i) =>
    i === 0 && isValidElement(c) ? cloneElement(c, { id, "aria-invalid": error ? true : undefined }) : c
  );
  return (
    <div className={`cop-field${wide ? " wide" : ""}${error ? " invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {kids}
      {error ? <small className="err">{error}</small> : hint ? <small>{hint}</small> : null}
    </div>
  );
}

export function ConfirmModal({ title, children, confirmLabel = "Confirm", danger, busy, error, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="cop-modal-body">
        <div className="cop-modal-text">{children}</div>
        {error && <Notice kind="error">{error}</Notice>}
      </div>
      <div className="cop-modal-foot">
        <button type="button" className="cop-btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className={`cop-btn${danger ? " danger-solid" : ""}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const emptyResident = { fullName: "", email: "", phone: "", sendWelcomeEmail: true };

// Add or edit a household. `household` (a HouseholdRow) switches it to edit mode.
export function HouseholdFormModal({ household, buildings = [], onClose, onSaved }) {
  const editing = !!household;
  const [form, setForm] = useState(
    editing
      ? {
          apartmentNumber: household.apartmentNumber,
          buildingName: household.buildingName,
          floorNumber: household.floorNumber ?? 1,
          occupancyStatus: household.occupancyStatus || "OCCUPIED",
          meterSerial: household.meter?.serialNumber || "",
          meterStatus: household.meter?.status || "ONLINE",
          createMeter: true,
          initialReading: "",
        }
      : {
          apartmentNumber: "",
          buildingName: buildings[0] || "",
          floorNumber: 1,
          occupancyStatus: "OCCUPIED",
          meterSerial: "",
          meterStatus: "ONLINE",
          createMeter: true,
          initialReading: "",
        }
  );
  const [withResident, setWithResident] = useState(!editing);
  const [resident, setResident] = useState(emptyResident);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const setRes = (k) => (e) => setResident((r) => ({ ...r, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.apartmentNumber.trim()) e.apartmentNumber = "Unit number is required.";
    else if (form.apartmentNumber.trim().length > 20) e.apartmentNumber = "Max 20 characters.";
    if (!form.buildingName.trim()) e.buildingName = "Building is required.";
    const floor = Number(form.floorNumber);
    if (form.floorNumber === "" || !Number.isInteger(floor) || floor < 0 || floor > 200) e.floorNumber = "Whole number, 0–200.";
    if (!editing && form.initialReading !== "" && (Number.isNaN(Number(form.initialReading)) || Number(form.initialReading) < 0))
      e.initialReading = "Must be 0 or more.";
    if (withResident && !editing) {
      if (!resident.fullName.trim()) e.resName = "Resident name is required.";
      if (!resident.email.trim()) e.resEmail = "Email is required.";
      else if (!EMAIL_RE.test(resident.email.trim())) e.resEmail = "Enter a valid email.";
      if (resident.phone.trim() && !PHONE_RE.test(resident.phone.trim())) e.resPhone = "7–20 digits, spaces, + - ( ).";
    }
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const body = {
      apartmentNumber: form.apartmentNumber.trim(),
      buildingName: form.buildingName.trim(),
      floorNumber: Number(form.floorNumber),
      occupancyStatus: form.occupancyStatus,
      meterSerial: form.meterSerial.trim() || null,
      meterStatus: editing ? form.meterStatus : null,
      ...(editing
        ? {}
        : {
            createMeter: form.createMeter,
            initialReading: form.initialReading === "" ? null : Number(form.initialReading),
            resident: withResident
              ? { fullName: resident.fullName.trim(), email: resident.email.trim(), phone: resident.phone.trim() || null, sendWelcomeEmail: resident.sendWelcomeEmail }
              : null,
          }),
    };
    try {
      const res = editing ? await communityAdminService.updateHousehold(household.apartmentId, body) : await communityAdminService.createHousehold(body);
      onSaved(res.data, editing ? "Household updated." : `Household ${body.apartmentNumber} added.`);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? `Edit household ${household.apartmentNumber}` : "Add household"} wide
      subtitle={editing ? "Update the unit, its meter and occupancy. Residents are managed on the household page." : "Creates the household, its water meter and (optionally) its first resident."}
      onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="cop-modal-body">
          <Notice kind="error">{serverError}</Notice>
          <div className="cop-form">
            <Field label="Unit / apartment number" error={errors.apartmentNumber}>
              <input value={form.apartmentNumber} onChange={set("apartmentNumber")} placeholder="e.g. B-204" maxLength={20} />
            </Field>
            <Field label="Building" error={errors.buildingName}>
              <input value={form.buildingName} onChange={set("buildingName")} list="hh-buildings" placeholder="e.g. Block B" maxLength={100} />
              <datalist id="hh-buildings">{buildings.map((b) => <option key={b} value={b} />)}</datalist>
            </Field>
            <Field label="Floor" error={errors.floorNumber}>
              <input type="number" min="0" max="200" value={form.floorNumber} onChange={set("floorNumber")} />
            </Field>
            <Field label="Occupancy">
              <select value={form.occupancyStatus} onChange={set("occupancyStatus")}>
                <option value="OCCUPIED">Occupied</option>
                <option value="VACANT">Vacant</option>
              </select>
            </Field>

            {!editing && (
              <div className="cop-field wide">
                <label className="cop-check"><input type="checkbox" checked={form.createMeter} onChange={set("createMeter")} /> Create a water meter for this household</label>
              </div>
            )}
            {(editing || form.createMeter) && (
              <>
                <Field label="Meter serial" hint={editing ? "Changing this re-labels the meter; readings are kept." : "Leave blank to generate one automatically."}>
                  <input value={form.meterSerial} onChange={set("meterSerial")} placeholder="Auto-generated" maxLength={50} />
                </Field>
                {editing ? (
                  <Field label="Meter status">
                    <select value={form.meterStatus} onChange={set("meterStatus")}>
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                      <option value="ALERT">Alert</option>
                    </select>
                  </Field>
                ) : (
                  <Field label="Initial meter reading (KL)" error={errors.initialReading} hint="Optional starting point for consumption.">
                    <input type="number" min="0" step="any" value={form.initialReading} onChange={set("initialReading")} />
                  </Field>
                )}
              </>
            )}
          </div>

          {!editing && (
            <div className="cop-modal-section">
              <label className="cop-check"><input type="checkbox" checked={withResident} onChange={(e) => setWithResident(e.target.checked)} /> Add the first resident now</label>
              {withResident && (
                <div className="cop-form" style={{ marginTop: 12 }}>
                  <Field label="Full name" error={errors.resName}><input value={resident.fullName} onChange={setRes("fullName")} maxLength={100} /></Field>
                  <Field label="Email" error={errors.resEmail} hint="Also becomes their portal login."><input type="email" value={resident.email} onChange={setRes("email")} maxLength={100} /></Field>
                  <Field label="Phone (optional)" error={errors.resPhone}><input value={resident.phone} onChange={setRes("phone")} maxLength={20} /></Field>
                  <div className="cop-field">
                    <label>&nbsp;</label>
                    <label className="cop-check"><input type="checkbox" checked={resident.sendWelcomeEmail} onChange={setRes("sendWelcomeEmail")} /> Send welcome email</label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="cop-modal-foot">
          <button type="button" className="cop-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="cop-btn" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add household"}</button>
        </div>
      </form>
    </Modal>
  );
}

// Add or edit a resident inside a household. `resident` (a ResidentRow) switches it to edit mode.
export function ResidentFormModal({ household, resident, onClose, onSaved }) {
  const editing = !!resident;
  const [form, setForm] = useState({
    fullName: resident?.fullName || "",
    email: resident?.email || "",
    phone: resident?.phone || "",
    sendWelcomeEmail: true,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const willGetLogin = !editing && !household.residents.some((r) => r.hasLogin);

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email.";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) e.phone = "7–20 digits, spaces, + - ( ).";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const body = { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() || null, sendWelcomeEmail: form.sendWelcomeEmail };
    try {
      const res = editing
        ? await communityAdminService.updateResident(household.apartmentId, resident.residentId, body)
        : await communityAdminService.addResident(household.apartmentId, body);
      onSaved(res.message);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? "Edit resident" : "Add resident"} subtitle={`Household ${household.apartmentNumber} · ${household.buildingName}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="cop-modal-body">
          <Notice kind="error">{serverError}</Notice>
          {!editing && (
            <Notice kind="info">
              {willGetLogin
                ? "This is the household's first resident, so they'll get a portal login. If this email already has a resident account that isn't linked to a household, that account is linked instead."
                : "Only the primary resident has a portal login; additional residents are kept as household members."}
            </Notice>
          )}
          <div className="cop-form">
            <Field label="Full name" error={errors.fullName}><input value={form.fullName} onChange={set("fullName")} maxLength={100} /></Field>
            <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={set("email")} maxLength={100} /></Field>
            <Field label="Phone (optional)" error={errors.phone}><input value={form.phone} onChange={set("phone")} maxLength={20} /></Field>
            {willGetLogin && (
              <div className="cop-field">
                <label>&nbsp;</label>
                <label className="cop-check"><input type="checkbox" checked={form.sendWelcomeEmail} onChange={set("sendWelcomeEmail")} /> Send welcome email</label>
              </div>
            )}
          </div>
        </div>
        <div className="cop-modal-foot">
          <button type="button" className="cop-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="cop-btn" disabled={saving}>{saving ? "Saving…" : editing ? "Save" : "Add resident"}</button>
        </div>
      </form>
    </Modal>
  );
}
