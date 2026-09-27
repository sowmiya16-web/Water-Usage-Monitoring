import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./CommunityOps.css";

// Shared shell for the Community Admin data pages: sidebar + header + content area.
export default function OpsLayout({ activePage, badge = "COMMUNITY ADMINISTRATION", title, subtitle, actions, children }) {
  return (
    <div className="cop-page">
      <AdminSidebar activePage={activePage} />
      <main className="cop-main">
        <header className="cop-header">
          <div className="cop-header-title">
            <span className="cop-badge">{badge}</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="cop-header-actions">{actions}</div>}
        </header>
        <div className="cop-content">{children}</div>
      </main>
    </div>
  );
}

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const kl = (n) => (n === undefined || n === null ? "—" : `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })} KL`);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function Notice({ kind = "info", children, onClose }) {
  if (!children) return null;
  return (
    <div className={`cop-notice ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

export function ChartTooltip({ active, payload, label, unit = "KL" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="cop-tooltip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <span key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} {unit}
        </span>
      ))}
    </div>
  );
}
