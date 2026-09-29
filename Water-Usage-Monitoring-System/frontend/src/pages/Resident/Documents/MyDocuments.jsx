import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import documentService from "../../../services/documentService";

import "./MyDocuments.css";

const STATUS_META = {
  NONE: { label: "Not submitted", cls: "doc-status-none" },
  PENDING: { label: "Pending review", cls: "doc-status-pending" },
  UNDER_REVIEW: { label: "Under review", cls: "doc-status-review" },
  VERIFIED: { label: "Verified", cls: "doc-status-verified" },
  REJECTED: { label: "Rejected", cls: "doc-status-rejected" },
};

const STEP_ORDER = ["PENDING", "UNDER_REVIEW", "VERIFIED"];

const STATUS_COPY = {
  NONE: {
    heading: "Get your residence verified",
    body: "You haven't submitted a document yet. Upload a valid ID or address proof below so your Community Admin can confirm your residency.",
  },
  PENDING: {
    heading: "Your document is in the queue",
    body: "We've received your document. A Community Admin will review it shortly — most reviews are completed within 24–48 hours.",
  },
  UNDER_REVIEW: {
    heading: "Your document is being reviewed",
    body: "A Community Admin has picked up your submission and is currently reviewing it. You'll see the result here as soon as it's ready.",
  },
  VERIFIED: {
    heading: "You're verified",
    body: "Your residence has been confirmed. You have full access to your apartment's account.",
  },
  REJECTED: {
    heading: "Your document needs attention",
    body: "Your last submission was rejected. Please review the reason below and upload a new, valid document.",
  },
};

const ICONS = {
  clock: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" /><path d="M12 10v4" /><path d="M12 17.2v.1" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9.5 12l2 2 3.5-3.5" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  ),
  timer: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4" /><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  ),
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const fmtSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Resident-facing document verification: upload an ID/address proof and track its review status.
function MyDocuments() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const uploadRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [settingsRes, docsRes] = await Promise.all([documentService.getSettings(), documentService.getMyDocuments()]);
      setSettings(settingsRes.data);
      setDocuments(docsRes.data || []);
      setDocumentType((prev) => prev || settingsRes.data?.documentTypes?.[0] || "");
      setError("");
    } catch (err) {
      setError(err.message || "Could not load your documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The resident's overall verification state: verified if ANY submission was ever approved,
  // otherwise the most recent submission's status (or NONE if nothing has been uploaded).
  const { overallStatus, latestDoc, rejectionReason } = useMemo(() => {
    const latest = documents[0] || null;
    const verified = documents.some((d) => d.status === "VERIFIED");
    const status = verified ? "VERIFIED" : latest ? latest.status : "NONE";
    const reason = status === "REJECTED" ? latest?.rejectionReason : null;
    return { overallStatus: status, latestDoc: latest, rejectionReason: reason };
  }, [documents]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    const errs = {};
    if (!documentType) errs.documentType = "Choose a document type.";
    if (!file) errs.file = "Choose a file to upload.";
    else if (settings && file.size > settings.maxFileSizeMb * 1024 * 1024) errs.file = `File is larger than the ${settings.maxFileSizeMb} MB limit.`;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setUploading(true);
    try {
      const res = await documentService.upload(documentType, file);
      setSuccess(res.message || "Document uploaded — pending review.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err.message || "Could not upload the document.");
    } finally {
      setUploading(false);
    }
  };

  const view = async (doc) => {
    try {
      await documentService.openDocument(doc.documentId, doc.fileName);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Remove this ${doc.documentType} submission? You can upload a new one right after.`)) return;
    setError("");
    setSuccess("");
    setRemovingId(doc.documentId);
    try {
      await documentService.deleteDocument(doc.documentId);
      setSuccess("Document removed.");
      await load();
    } catch (err) {
      setError(err.message || "Could not remove the document.");
    } finally {
      setRemovingId(null);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(overallStatus);
  const copy = STATUS_COPY[overallStatus] || STATUS_COPY.NONE;

  return (
    <div className="mydocs-page">
      <Sidebar activePage="My Documents" onLogout={handleLogout} />

      <main className="mydocs-main">
        <Header activePage="My Documents" />

        <div className="mydocs-content">
          <div className="mydocs-heading">
            <span className="section-label">DOCUMENT VERIFICATION</span>
            <h2>Verification Center</h2>
            <p>Verify your residency once to unlock full access to your apartment's water usage, bills, payments and alerts.</p>
          </div>

          {error && <div className="mydocs-notice error">{error}</div>}
          {success && <div className="mydocs-notice success">{success}</div>}

          {loading ? (
            <div className="mydocs-loading">Loading your verification status…</div>
          ) : (
            <>
              {/* ===== Status hero ===== */}
              <div className={`docver-hero docver-hero-${overallStatus.toLowerCase()}`}>
                <div className="docver-hero-top">
                  <div className={`docver-hero-icon icon-${overallStatus.toLowerCase()}`}>
                    {overallStatus === "VERIFIED" ? ICONS.check : overallStatus === "REJECTED" ? ICONS.alert : ICONS.clock}
                  </div>
                  <div className="docver-hero-text">
                    <h3>{copy.heading}</h3>
                    <p>{copy.body}</p>
                    {overallStatus === "REJECTED" && rejectionReason && (
                      <div className="docver-reason"><strong>Reason given:</strong> {rejectionReason}</div>
                    )}
                  </div>
                  {overallStatus !== "VERIFIED" && (
                    <button type="button" className="mydocs-btn docver-hero-cta" onClick={scrollToUpload}>
                      {ICONS.upload} {overallStatus === "REJECTED" ? "Upload new document" : overallStatus === "NONE" ? "Upload document" : "Upload another"}
                    </button>
                  )}
                </div>

                {overallStatus !== "REJECTED" && (
                  <div className="docver-steps" role="list" aria-label="Verification progress">
                    {["Submitted", "Under review", "Verified"].map((label, i) => {
                      const isLastAndVerified = i === STEP_ORDER.length - 1 && overallStatus === "VERIFIED";
                      const state = i < stepIndex || isLastAndVerified ? "done" : i === stepIndex ? "current" : "todo";
                      return (
                        <div className={`docver-step ${state}`} key={label} role="listitem">
                          <span className="docver-step-dot">{state === "done" ? "✓" : i + 1}</span>
                          <span className="docver-step-label">{label}</span>
                          {i < 2 && <span className="docver-step-line" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ===== Upload ===== */}
              <form className="mydocs-upload-card" onSubmit={submit} noValidate ref={uploadRef}>
                <h3>Upload a document</h3>
                {settings?.instructions && <p className="mydocs-instructions">{settings.instructions}</p>}
                <div className="mydocs-form-row">
                  <div className={`mydocs-field${fieldErrors.documentType ? " invalid" : ""}`}>
                    <label htmlFor="doc-type">Document type</label>
                    <select id="doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                      {(settings?.documentTypes || []).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {fieldErrors.documentType && <small className="err">{fieldErrors.documentType}</small>}
                  </div>
                  <div className={`mydocs-field${fieldErrors.file ? " invalid" : ""}`}>
                    <label htmlFor="doc-file">File (PDF, JPG or PNG, max {settings?.maxFileSizeMb || 5} MB)</label>
                    <input id="doc-file" ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    {fieldErrors.file && <small className="err">{fieldErrors.file}</small>}
                  </div>
                </div>
                <button type="submit" className="mydocs-btn" disabled={uploading}>
                  {uploading ? "Uploading…" : "Upload document"}
                </button>
              </form>

              {/* ===== Info grid: required docs, formats, guidelines, timeline, security ===== */}
              <div className="docver-info-grid">
                <div className="docver-info-card">
                  <div className="docver-info-head"><span className="docver-info-icon">{ICONS.file}</span><h4>Required documents</h4></div>
                  <p className="docver-info-lead">Any one of the following, showing your name and this address:</p>
                  <ul className="docver-checklist">
                    {(settings?.documentTypes || []).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>

                <div className="docver-info-card">
                  <div className="docver-info-head"><span className="docver-info-icon">{ICONS.list}</span><h4>Accepted formats</h4></div>
                  <ul className="docver-plainlist">
                    <li>PDF, JPG or PNG only</li>
                    <li>Maximum file size: {settings?.maxFileSizeMb || 5} MB</li>
                    <li>One file per upload — re-upload to replace</li>
                  </ul>
                </div>

                <div className="docver-info-card">
                  <div className="docver-info-head"><span className="docver-info-icon">{ICONS.check}</span><h4>Verification guidelines</h4></div>
                  <ul className="docver-plainlist">
                    <li>Use a clear, in-focus photo or scan</li>
                    <li>Show the full document — no cropped corners</li>
                    <li>Make sure the name and address are legible</li>
                    <li>Only unexpired, government-recognised documents</li>
                  </ul>
                </div>

                <div className="docver-info-card">
                  <div className="docver-info-head"><span className="docver-info-icon">{ICONS.timer}</span><h4>Submission timeline</h4></div>
                  <ul className="docver-plainlist">
                    <li>Uploads are queued for review immediately</li>
                    <li>Most documents are reviewed within 24–48 hours</li>
                    <li>You'll see the result here as soon as it's decided</li>
                  </ul>
                </div>

                <div className="docver-info-card docver-info-wide">
                  <div className="docver-info-head"><span className="docver-info-icon">{ICONS.shield}</span><h4>Security & privacy</h4></div>
                  <p className="docver-info-lead">
                    Your document is stored securely and is only ever visible to your Community Admin for the purpose of
                    verifying your residency. It is never shared with other residents or third parties, and you can
                    replace it at any time by uploading a new one.
                  </p>
                </div>
              </div>

              {/* ===== History ===== */}
              <div className="mydocs-list-card">
                <h3>Your uploads</h3>
                {documents.length ? (
                  <div className="mydocs-table-wrap">
                    <table className="mydocs-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>File</th>
                          <th>Size</th>
                          <th>Uploaded</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((d) => {
                          const meta = STATUS_META[d.status] || STATUS_META.PENDING;
                          return (
                            <tr key={d.documentId}>
                              <td>{d.documentType}</td>
                              <td className="mydocs-filename">{d.fileName}</td>
                              <td>{fmtSize(d.fileSize)}</td>
                              <td title={fmtDateTime(d.uploadedAt)}>{fmtDate(d.uploadedAt)}</td>
                              <td>
                                <span className={`doc-status-pill ${meta.cls}`}>{meta.label}</span>
                                {d.status === "REJECTED" && d.rejectionReason && (
                                  <div className="mydocs-rejection">Reason: {d.rejectionReason}</div>
                                )}
                              </td>
                              <td className="mydocs-actions">
                                <button type="button" className="mydocs-link" onClick={() => view(d)}>View</button>
                                {d.status === "PENDING" && (
                                  <button type="button" className="mydocs-link danger" onClick={() => remove(d)} disabled={removingId === d.documentId}>
                                    {removingId === d.documentId ? "Removing…" : "Remove"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mydocs-empty">You haven't uploaded any documents yet.</div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyDocuments;
