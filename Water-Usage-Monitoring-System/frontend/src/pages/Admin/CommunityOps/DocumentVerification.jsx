import { useCallback, useEffect, useState } from "react";
import documentService from "../../../services/documentService";
import OpsLayout, { Notice, fmtDate } from "./OpsLayout";

const STATUS_META = {
  PENDING: { label: "Pending", cls: "warn" },
  UNDER_REVIEW: { label: "Under review", cls: "info" },
  VERIFIED: { label: "Verified", cls: "ok" },
  REJECTED: { label: "Rejected", cls: "bad" },
};
const PAGE_SIZE = 10;

function fmtBytes(b) {
  if (!b && b !== 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function ReviewModal({ doc, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const act = async (action) => {
    setError("");
    if (action === "REJECT" && !reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await documentService.review(doc.documentId, action, reason.trim() || undefined);
      onDone(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cop-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cop-modal" role="dialog" aria-modal="true" aria-label="Review document">
        <div className="cop-modal-head">
          <div>
            <h3>Review document</h3>
            <p>{doc.apartmentNumber} · {doc.buildingName} — {doc.documentType}</p>
          </div>
          <button type="button" className="cop-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cop-modal-body">
          <Notice kind="error">{error}</Notice>
          <dl className="cop-dl">
            <div><dt>Uploaded by</dt><dd>{doc.uploaderName}</dd></div>
            <div><dt>File</dt><dd>{doc.fileName} ({fmtBytes(doc.fileSize)})</dd></div>
            <div><dt>Uploaded</dt><dd>{fmtDate(doc.uploadedAt)}</dd></div>
            <div><dt>Status</dt><dd><span className={`cop-pill ${STATUS_META[doc.status]?.cls}`}>{STATUS_META[doc.status]?.label}</span></dd></div>
          </dl>
          <button type="button" className="cop-btn ghost small" onClick={() => documentService.openDocument(doc.documentId, doc.fileName).catch((e) => setError(e.message))}>
            ↓ View file
          </button>
          <div className="cop-field wide" style={{ marginTop: 14 }}>
            <label htmlFor="rev-reason">Rejection reason (required to reject)</label>
            <textarea id="rev-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Document is blurry, please re-upload a clearer scan." maxLength={1000} />
          </div>
        </div>
        <div className="cop-modal-foot">
          <button type="button" className="cop-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          {doc.status === "PENDING" && (
            <button type="button" className="cop-btn ghost" onClick={() => act("UNDER_REVIEW")} disabled={busy}>Mark under review</button>
          )}
          <button type="button" className="cop-btn danger-solid" onClick={() => act("REJECT")} disabled={busy}>Reject</button>
          <button type="button" className="cop-btn" onClick={() => act("VERIFY")} disabled={busy}>{busy ? "Working…" : "Verify"}</button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ onSaved }) {
  const [settings, setSettings] = useState(null);
  const [typesText, setTypesText] = useState("");
  const [maxSize, setMaxSize] = useState(5);
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    documentService.getSettings().then((res) => {
      setSettings(res.data);
      setTypesText((res.data.documentTypes || []).join(", "));
      setMaxSize(res.data.maxFileSizeMb);
      setInstructions(res.data.instructions || "");
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const types = typesText.split(",").map((t) => t.trim()).filter(Boolean);
    if (!types.length) return setError("At least one document type is required.");
    const size = Number(maxSize);
    if (!Number.isFinite(size) || size < 1 || size > 25) return setError("Max file size must be between 1 and 25 MB.");
    setSaving(true);
    try {
      const res = await documentService.updateSettings({ documentTypes: types, maxFileSizeMb: size, instructions });
      setSuccess(res.message || "Settings updated.");
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="cop-loading">Loading settings…</div>;

  return (
    <form className="cop-card" onSubmit={save} noValidate>
      <div className="cop-card-head">
        <div><h3>Verification settings</h3><p>Controls what residents can upload, community-wide</p></div>
      </div>
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>
      <div className="cop-form">
        <div className="cop-field wide">
          <label htmlFor="doc-types">Accepted document types (comma-separated)</label>
          <input id="doc-types" value={typesText} onChange={(e) => setTypesText(e.target.value)} placeholder="ID Proof, Address Proof, Ownership Proof" />
        </div>
        <div className="cop-field">
          <label htmlFor="max-size">Max file size (MB)</label>
          <input id="max-size" type="number" min="1" max="25" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} />
          <small>PDF, JPG and PNG only — fixed for security, not configurable here.</small>
        </div>
        <div className="cop-field wide">
          <label htmlFor="instructions">Upload instructions shown to residents</label>
          <textarea id="instructions" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} />
        </div>
        <div className="cop-form-actions">
          <button type="submit" className="cop-btn" disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
        </div>
      </div>
    </form>
  );
}

function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    documentService.getStats().then((res) => setStats(res.data)).catch((e) => setError(e.message));
  }, []);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!stats) return <div className="cop-loading">Loading statistics…</div>;

  return (
    <>
      <div className="cop-stats">
        <div className="cop-stat"><span>Total documents</span><strong>{stats.total}</strong><small>All communities</small></div>
        <div className="cop-stat"><span>Pending</span><strong>{stats.pending}</strong><small>Awaiting review</small></div>
        <div className="cop-stat"><span>Under review</span><strong>{stats.underReview}</strong><small>Claimed by a reviewer</small></div>
        <div className="cop-stat"><span>Verified</span><strong>{stats.verified}</strong><small>{stats.verificationRatePct}% of reviewed</small></div>
        <div className="cop-stat"><span>Rejected</span><strong>{stats.rejected}</strong><small>Needs re-upload</small></div>
      </div>
      <div className="cop-grid-eq">
        <div className="cop-card">
          <div className="cop-card-head"><div><h3>By building</h3></div></div>
          <div className="cop-table-wrap">
            <table className="cop-table">
              <thead><tr><th>Building</th><th className="num">Total</th><th className="num">Pending</th><th className="num">Verified</th><th className="num">Rejected</th></tr></thead>
              <tbody>
                {stats.byBuilding.map((b) => (
                  <tr key={b.buildingName}>
                    <td>{b.buildingName}</td><td className="num">{b.total}</td><td className="num">{b.pending + b.underReview}</td>
                    <td className="num">{b.verified}</td><td className="num">{b.rejected}</td>
                  </tr>
                ))}
                {!stats.byBuilding.length && <tr><td colSpan={5} className="cop-empty">No documents yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="cop-card">
          <div className="cop-card-head"><div><h3>By document type</h3></div></div>
          <div className="cop-table-wrap">
            <table className="cop-table">
              <thead><tr><th>Type</th><th className="num">Count</th></tr></thead>
              <tbody>
                {stats.byType.map((t) => (
                  <tr key={t.documentType}><td>{t.documentType}</td><td className="num">{t.total}</td></tr>
                ))}
                {!stats.byType.length && <tr><td colSpan={2} className="cop-empty">No documents yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// Document Verification: the review queue (Community Admin + Admin) and, for Admin only,
// community-wide statistics and settings.
export default function DocumentVerification() {
  const isAdmin = localStorage.getItem("userRole") === "admin"; // ROLE_PROPERTY_ADMIN
  const [tab, setTab] = useState("queue");
  const [status, setStatus] = useState("PENDING");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    try {
      const res = await documentService.getReviewQueue({ status, q: search, page, size: PAGE_SIZE });
      setData(res.data);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load the review queue.");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    if (tab === "queue") load();
  }, [tab, load]);

  const rows = data?.documents || [];
  const matched = data?.matched || 0;
  const pages = Math.max(1, Math.ceil(matched / PAGE_SIZE));

  return (
    <OpsLayout
      activePage="Document Verification"
      title="Document Verification"
      subtitle="Review resident-uploaded documents and manage community-wide verification"
      actions={
        isAdmin && (
          <div className="cop-toolbar" style={{ marginBottom: 0 }}>
            <button type="button" className={`cop-btn ${tab === "queue" ? "" : "ghost"} small`} onClick={() => setTab("queue")}>Review Queue</button>
            <button type="button" className={`cop-btn ${tab === "stats" ? "" : "ghost"} small`} onClick={() => setTab("stats")}>Statistics</button>
            <button type="button" className={`cop-btn ${tab === "settings" ? "" : "ghost"} small`} onClick={() => setTab("settings")}>Settings</button>
          </div>
        )
      }
    >
      {tab === "stats" && isAdmin && <StatsPanel />}
      {tab === "settings" && isAdmin && <SettingsPanel />}

      {tab === "queue" && (
        <>
          <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
          <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>
          {loading && !data && <div className="cop-loading">Loading review queue…</div>}

          {data && (
            <>
              <div className="cop-stats">
                <div className="cop-stat"><span>Pending</span><strong>{data.pending}</strong></div>
                <div className="cop-stat"><span>Under review</span><strong>{data.underReview}</strong></div>
                <div className="cop-stat"><span>Verified</span><strong>{data.verified}</strong></div>
                <div className="cop-stat"><span>Rejected</span><strong>{data.rejected}</strong></div>
              </div>

              <div className="cop-card">
                <div className="cop-toolbar">
                  <input className="cop-search" type="search" placeholder="Search unit, building, resident or document type…" value={q} onChange={(e) => setQ(e.target.value)} />
                  <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
                    <option value="ALL">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="UNDER_REVIEW">Under review</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="cop-table-wrap">
                  <table className="cop-table">
                    <thead>
                      <tr>
                        <th>Household</th><th>Resident</th><th>Type</th><th>File</th><th>Uploaded</th><th>Status</th><th className="num">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => {
                        const meta = STATUS_META[d.status] || STATUS_META.PENDING;
                        return (
                          <tr key={d.documentId}>
                            <td><strong>{d.apartmentNumber}</strong><div className="cop-sub">{d.buildingName}</div></td>
                            <td>{d.uploaderName}</td>
                            <td>{d.documentType}</td>
                            <td className="cop-mono">{d.fileName}</td>
                            <td>{fmtDate(d.uploadedAt)}</td>
                            <td>
                              <span className={`cop-pill ${meta.cls}`}>{meta.label}</span>
                              {d.status === "REJECTED" && d.rejectionReason && <div className="cop-sub">Reason: {d.rejectionReason}</div>}
                            </td>
                            <td className="num">
                              {(d.status === "PENDING" || d.status === "UNDER_REVIEW") ? (
                                <button type="button" className="cop-btn small" onClick={() => setReviewing(d)}>Review</button>
                              ) : (
                                <button type="button" className="cop-btn ghost small" onClick={() => documentService.openDocument(d.documentId, d.fileName).catch((e) => setError(e.message))}>View</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {!rows.length && <tr><td colSpan={7} className="cop-empty">No documents match these filters.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {matched > 0 && (
                  <div className="cop-pager">
                    <span>Showing {page * PAGE_SIZE + 1}–{Math.min(matched, (page + 1) * PAGE_SIZE)} of {matched}</span>
                    <div>
                      <button type="button" className="cop-btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
                      <span className="cop-pager-num">Page {page + 1} of {pages}</span>
                      <button type="button" className="cop-btn ghost small" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {reviewing && (
        <ReviewModal doc={reviewing} onClose={() => setReviewing(null)}
          onDone={async (msg) => { setReviewing(null); setSuccess(msg); await load(); }} />
      )}
    </OpsLayout>
  );
}
