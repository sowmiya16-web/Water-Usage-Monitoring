import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import "./PortalTools.css";

// Where an admin can jump to in the Resident Portal.
const RESIDENT_LINKS = [
  { label: "Dashboard", path: "/resident/dashboard" },
  { label: "Consumption Comparison", path: "/resident/consumption-comparison" },
  { label: "Usage History", path: "/resident/usage-history" },
  { label: "Current Bill", path: "/resident/current-bill" },
  { label: "Billing History", path: "/resident/billing-history" },
  { label: "Alerts", path: "/resident/alerts" },
];

export const PREVIEW_KEY = "residentPreview";

function ResidentPortalMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const go = (path) => {
    // Per-tab flag: lets an admin enter resident pages as a read-only preview (see ResidentRoute in App.jsx)
    try {
      sessionStorage.setItem(PREVIEW_KEY, "1");
    } catch {
      /* sessionStorage unavailable: the resident pages that need it will redirect back */
    }
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="pt-resident notranslate" translate="no" ref={ref}>
      <button type="button" className="pt-resident-main" onClick={() => go("/resident/dashboard")} title="Open the Resident Portal">
        🏠 <span>Resident Portal</span>
      </button>
      <button type="button" className="pt-resident-caret" aria-label="More Resident Portal pages" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ▾
      </button>
      {open && (
        <ul className="pt-resident-menu" role="menu">
          {RESIDENT_LINKS.map((l) => (
            <li key={l.path} role="none">
              <button type="button" role="menuitem" onClick={() => go(l.path)}>
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Adds the language selector (and the Resident Portal button) to the top header of whichever admin page
 * is showing. Every admin page renders its sidebar, so mounting this once in the sidebar puts the tools on
 * all of them, in the same place, without editing each page's own header markup.
 */
export default function PortalTools({ showResidentPortal = true }) {
  const anchor = useRef(null);
  const location = useLocation();
  const [slot, setSlot] = useState(null);

  useLayoutEffect(() => {
    const wrapper = anchor.current?.parentElement;
    if (!wrapper) return undefined;
    let el = null;

    const attach = () => {
      if (el && el.isConnected) return;
      const main = wrapper.querySelector(":scope > main");
      const header = main && (main.querySelector(":scope > header") || main.querySelector(".admin-page-heading") || main.firstElementChild);
      if (!header) return;
      const host = header.querySelector(".admin-header-right, .cop-header-actions, .comm-header-right") || header;
      el = document.createElement("div");
      el.className = "portal-tools";
      host.appendChild(el);
      setSlot(el);
    };

    attach();
    // A page may swap its header (loading states, tabs); re-attach when ours is removed.
    const observer = new MutationObserver(attach);
    observer.observe(wrapper, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (el) el.remove();
      setSlot(null);
    };
  }, [location.pathname]);

  return (
    <>
      <span ref={anchor} hidden />
      {slot &&
        createPortal(
          <>
            {showResidentPortal && <ResidentPortalMenu />}
            <LanguageSelector variant="header-variant" />
          </>,
          slot
        )}
    </>
  );
}
