import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import communityAdminService from "../../../services/communityAdminService";
import OpsLayout, { Notice, inr, kl } from "./OpsLayout";
import { ConfirmModal, HouseholdFormModal } from "./HouseholdModals";

const monthNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const PAGE_SIZE = 10;

export const meterPill = (s) => (s === "ONLINE" ? "ok" : s === "ALERT" ? "bad" : "warn");

// Household Management: every household with its residents, meter, and this month's usage in one dashboard.
export default function Households() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(monthNow());
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [building, setBuilding] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("usage");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formFor, setFormFor] = useState(null); // null | "new" | HouseholdRow
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    try {
      const res = await communityAdminService.getHouseholds({ month, q: search, building, status, sort, page, size: PAGE_SIZE });
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e.message || "Could not load households.");
    } finally {
      setLoading(false);
    }
  }, [month, search, building, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = async (detail, message) => {
    setFormFor(null);
    setSuccess(message);
    await load();
    if (detail?.household?.apartmentId && message.includes("added")) navigate(`/admin/households/${detail.household.apartmentId}`);
  };

  const confirmDelete = async () => {
    setDelBusy(true);
    setDelError("");
    try {
      const res = await communityAdminService.deleteHousehold(deleting.apartmentId);
      setSuccess(res.message);
      setDeleting(null);
      if (data && data.households.length === 1 && page > 0) setPage(page - 1);
      else await load();
    } catch (e) {
      setDelError(e.message);
    } finally {
      setDelBusy(false);
    }
  };

  const rows = data?.households || [];
  const matched = data?.matched || 0;
  const pages = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  const from = matched ? page * PAGE_SIZE + 1 : 0;
  const to = Math.min(matched, (page + 1) * PAGE_SIZE);

  return (
    <OpsLayout
      activePage="Households"
      title="Household Management"
      subtitle="Add, edit and manage every household with its residents, meter and monthly water usage"
      actions={
        <>
          <div className="cop-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <label htmlFor="hh-month">Month</label>
            <input id="hh-month" type="month" value={month} max={monthNow()} onChange={(e) => { setMonth(e.target.value || monthNow()); setPage(0); }} />
          </div>
          <button type="button" className="cop-btn" onClick={() => setFormFor("new")}>+ Add household</button>
        </>
      }
    >
      <Notice kind="error" onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>
      {loading && !data && <div className="cop-loading">Loading households…</div>}

      {data && (
        <>
          <div className="cop-stats">
            <div className="cop-stat"><span>Households</span><strong>{data.total}</strong><small>{data.occupied} occupied · {data.vacant} vacant</small></div>
            <div className="cop-stat"><span>Water meters</span><strong>{data.withMeter}</strong><small>{data.total - data.withMeter} without a meter</small></div>
            <div className="cop-stat"><span>Community total</span><strong>{kl(data.totalKl)}</strong><small>{data.month}</small></div>
            <div className="cop-stat"><span>Average per household</span><strong>{kl(data.averageKl)}</strong><small>All households</small></div>
            <div className="cop-stat"><span>High users</span><strong>{data.highUsers}</strong><small>More than 1.5× the average</small></div>
          </div>

          <div className="cop-card">
            <div className="cop-toolbar">
              <input className="cop-search" type="search" placeholder="Search unit, building, resident, email or meter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search households" />
              <select value={building} onChange={(e) => { setBuilding(e.target.value); setPage(0); }} aria-label="Building">
                <option value="">All buildings</option>
                {data.buildings.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Status">
                <option value="ALL">All statuses</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="VACANT">Vacant</option>
                <option value="HIGH">High users</option>
                <option value="NO_METER">No meter</option>
                <option value="NO_READINGS">No readings this month</option>
                <option value="PENDING_BILLS">Pending bills</option>
              </select>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }} aria-label="Sort">
                <option value="usage">Highest usage</option>
                <option value="change">Biggest increase</option>
                <option value="name">Building / unit</option>
              </select>
            </div>

            <div className="cop-table-wrap">
              <table className="cop-table">
                <thead>
                  <tr>
                    <th>Household</th>
                    <th>Residents</th>
                    <th>Meter</th>
                    <th className="num">This month</th>
                    <th className="num">Previous</th>
                    <th className="num">Change</th>
                    <th className="num">Share</th>
                    <th className="num">Pending</th>
                    <th className="num">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h) => (
                    <tr key={h.apartmentId}>
                      <td>
                        <button type="button" className="cop-link" onClick={() => navigate(`/admin/households/${h.apartmentId}`)}>
                          <strong>{h.apartmentNumber}</strong>
                        </button>
                        <div className="cop-sub">{h.buildingName} · floor {h.floorNumber} · <span className={`cop-pill ${h.occupancyStatus === "OCCUPIED" ? "ok" : ""}`}>{h.occupancyStatus === "OCCUPIED" ? "Occupied" : "Vacant"}</span></div>
                      </td>
                      <td>
                        {h.residents.length ? (
                          <>
                            <strong>{h.residents[0].fullName}</strong>
                            {h.residents.length > 1 && <span className="cop-sub"> +{h.residents.length - 1} more</span>}
                            <div className="cop-sub">{h.residents[0].email}</div>
                          </>
                        ) : <span className="cop-sub">No residents</span>}
                      </td>
                      <td>
                        {h.meter ? (
                          <>
                            <span className="cop-mono">{h.meter.serialNumber}</span>
                            <div><span className={`cop-pill ${meterPill(h.meter.status)}`}>{h.meter.status}</span></div>
                          </>
                        ) : <span className="cop-pill warn">No meter</span>}
                      </td>
                      <td className="num"><strong>{kl(h.currentKl)}</strong><div className="cop-sub">{h.readingDays} reading day{h.readingDays === 1 ? "" : "s"}</div></td>
                      <td className="num">{kl(h.previousKl)}</td>
                      <td className="num">
                        {h.changePct === undefined || h.changePct === null ? "—" : (
                          <span className={h.changePct > 0 ? "cop-up" : "cop-down"}>{h.changePct > 0 ? "▲" : "▼"} {Math.abs(h.changePct)}%</span>
                        )}
                      </td>
                      <td className="num">{h.sharePct}%</td>
                      <td className="num">{h.pendingBills ? <span className="cop-pill warn">{h.pendingBills} · {inr(h.pendingAmount)}</span> : "—"}</td>
                      <td className="num cop-actions">
                        <button type="button" className="cop-btn ghost small" onClick={() => navigate(`/admin/households/${h.apartmentId}`)}>View</button>{" "}
                        <button type="button" className="cop-btn ghost small" onClick={() => setFormFor(h)}>Edit</button>{" "}
                        <button type="button" className="cop-btn danger small" onClick={() => { setDelError(""); setDeleting(h); }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={9} className="cop-empty">
                        {data.total === 0 ? "No households yet — click “Add household” to create the first one." : "No households match these filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {matched > 0 && (
              <div className="cop-pager">
                <span>Showing {from}–{to} of {matched}</span>
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

      {formFor && (
        <HouseholdFormModal
          household={formFor === "new" ? null : formFor}
          buildings={data?.buildings || []}
          onClose={() => setFormFor(null)}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <ConfirmModal
          title={`Delete household ${deleting.apartmentNumber}?`}
          confirmLabel="Delete household"
          danger
          busy={delBusy}
          error={delError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        >
          This permanently removes <strong>{deleting.apartmentNumber} · {deleting.buildingName}</strong>, its water meter, all of its meter readings and its
          residents ({deleting.residents.length}), including their portal login. Households that have bills can't be deleted — mark them Vacant instead.
        </ConfirmModal>
      )}
    </OpsLayout>
  );
}
