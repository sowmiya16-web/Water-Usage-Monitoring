import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import "./MeterTips.css";

// Jump-off points into the real, data-backed pages these tips keep referring back to.
const QUICK_LINKS = [
  { icon: "▣", label: "Meter Details", desc: "Live reading & diagnostics", route: "/resident/meter-details" },
  { icon: "◉", label: "Water Consumption", desc: "Daily & monthly trend", route: "/resident/water-consumption" },
  { icon: "⇄", label: "Consumption Comparison", desc: "You vs. neighbours", route: "/resident/consumption-comparison" },
  { icon: "♢", label: "Alerts", desc: "Leak & high-usage alerts", route: "/resident/alerts" },
];

const METER_DETAILS = { label: "Meter Details", route: "/resident/meter-details" };
const WATER_CONSUMPTION = { label: "Water Consumption", route: "/resident/water-consumption" };
const USAGE_HISTORY = { label: "Usage History", route: "/resident/usage-history" };
const CONSUMPTION_COMPARISON = { label: "Consumption Comparison", route: "/resident/consumption-comparison" };
const ALERTS = { label: "Alerts", route: "/resident/alerts" };
const CURRENT_BILL = { label: "Current Bill", route: "/resident/current-bill" };
const HELP_SUPPORT = { label: "Help & Support", route: "/resident/help" };

const CATEGORIES = [
  {
    id: "reading",
    title: "Reading Your Meter",
    subtitle: "Know what the numbers mean before you need them",
    color: "#0284c7",
    bg: "#e0f2fe",
    icon: "🔢",
    tips: [
      {
        id: "units",
        icon: "🔢",
        title: "Know your units",
        teaser: "Your meter counts in kilolitres (KL) — 1 KL equals 1,000 litres, and it's the exact figure that drives your bill.",
        detail: {
          impact: "This is the same total shown on Current Bill — knowing how to read it means a bill is never a surprise.",
          steps: [
            "The digits before the decimal point are whole kilolitres used since installation.",
            "Digits after the decimal are litres — usually not billed separately, but useful for precise tracking.",
            "Match this total against the reading on Meter Details to confirm your account is in sync.",
          ],
          related: METER_DETAILS,
        },
      },
      {
        id: "weekly-reading",
        icon: "📆",
        title: "Take a weekly manual reading",
        teaser: "Noting the reading once a week turns a monthly surprise into a trend you can see coming.",
        detail: {
          impact: "A weekly log catches a problem in days, not the 30 days it takes for a bill to arrive.",
          steps: [
            "Pick one fixed day and time each week — for example, Sunday morning.",
            "Write the number down, or photograph the dial for a record.",
            "Plot it against last week's figure so you're tracking a trend, not a single total.",
          ],
          related: USAGE_HISTORY,
        },
      },
      {
        id: "low-flow-indicator",
        icon: "⭐",
        title: "Watch the low-flow indicator",
        teaser: "A small star or triangle dial spins with even a trickle of water — it's the fastest leak check you have.",
        detail: {
          impact: "This dial reacts to flows too small to move the main digits, so it flags a leak long before your total visibly changes.",
          steps: [
            "Locate the small star-, triangle-, or spinner-shaped dial on the meter face.",
            "With every tap and appliance off, watch it for a full 60 seconds.",
            "Any movement at all means water is flowing somewhere in the system right now.",
          ],
        },
      },
      {
        id: "zero-flow-baseline",
        icon: "🌙",
        title: "Set a true zero-flow baseline",
        teaser: "Read the meter last thing at night and first thing in the morning — any gap is water lost while nobody was using any.",
        detail: {
          impact: "This is the single most reliable home test for a slow leak, because it removes all normal daytime usage from the picture.",
          steps: [
            "Read the meter right before bed, after the last tap is closed for the night.",
            "Read it again first thing in the morning, before anyone uses water.",
            "Any increase overnight is a leak, not usage — there's no other explanation for it.",
          ],
        },
      },
      {
        id: "live-flow-rate",
        icon: "⚡",
        title: "Check the live flow rate, not just the total",
        teaser: "Many smart meters show a live litres-per-minute figure — it tells you what's happening right now, not just what's already used.",
        detail: {
          impact: "This is the fastest way to catch a leak — you don't have to wait for a daily total to update.",
          steps: [
            "Open Meter Details and look at the current flow-rate reading.",
            "A reading of 0 L/min with everything off is normal.",
            "A steady low flow (roughly 1–5 L/min) with nothing running is the clearest live sign of a leak.",
          ],
          related: METER_DETAILS,
        },
      },
      {
        id: "reading-log",
        icon: "📝",
        title: "Keep a simple reading log",
        teaser: "A one-line note each week turns your meter into an early-warning system instead of a mystery number on a bill.",
        detail: {
          impact: "A log makes it obvious when a change in usage has a simple explanation — guests, laundry day — or doesn't.",
          steps: [
            "Note the date, the reading, and anything unusual that week (guests, extra laundry, and so on).",
            "Review it once a month alongside Usage History.",
            "Use it to sanity-check every bill before you pay it.",
          ],
          related: USAGE_HISTORY,
        },
      },
    ],
  },
  {
    id: "leaks",
    title: "Leak Detection",
    subtitle: "Catch a leak before it reaches the next bill",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "🚨",
    tips: [
      {
        id: "zero-flow-test",
        icon: "⏱",
        title: "Run the two-hour zero-flow test",
        teaser: "Turn everything off for two hours and read the meter before and after — any movement means a leak somewhere.",
        detail: {
          impact: "This test isolates your whole home's plumbing at once, so it catches leaks that are too small to notice day to day.",
          steps: [
            "Turn off every tap, appliance and irrigation valve.",
            "Avoid using any water at all for two hours.",
            "Read the meter before and after — if the number moved at all, there's a leak in the supply line or a fixture.",
          ],
          related: METER_DETAILS,
        },
      },
      {
        id: "toilet-dye-test",
        icon: "🎨",
        title: "Try the toilet dye test",
        teaser: "A few drops of food colouring in the cistern reveal a worn flapper valve — the single most common hidden leak.",
        detail: {
          impact: "Toilets are the most common source of a hidden leak, and this test costs nothing and takes ten minutes.",
          steps: [
            "Add a few drops of food colouring to the cistern tank.",
            "Wait 10 minutes without flushing.",
            "Colour appearing in the bowl means the flapper valve is worn and needs replacing.",
          ],
        },
      },
      {
        id: "inspect-and-listen",
        icon: "👂",
        title: "Inspect and listen",
        teaser: "Damp patches, mould, or a faint hiss with everything off are early physical signs a meter reading alone won't show you.",
        detail: {
          steps: [
            "Check under sinks, around the water heater, and at outdoor taps for damp patches or mould.",
            "Listen for a faint hissing sound when every fixture in the home is switched off.",
            "Small leaks are usually heard, or felt as dampness, well before they're ever seen.",
          ],
        },
      },
      {
        id: "wet-patch-meter-box",
        icon: "🚧",
        title: "A wet patch only near the meter box",
        teaser: "Dampness right at the meter box, and nowhere else, usually points to the underground supply pipe — not your plumbing.",
        detail: {
          impact: "This isn't in-home plumbing, so trying to fix it yourself isn't safe or necessary — it's a maintenance job.",
          steps: [
            "Check whether the dampness is limited specifically to the area around the meter box.",
            "If your indoor plumbing is otherwise dry, the leak is most likely in the supply pipe before the meter.",
            "Raise a ticket on Help & Support so building maintenance can inspect and repair it.",
          ],
          related: HELP_SUPPORT,
        },
      },
      {
        id: "bill-vs-log",
        icon: "🧾",
        title: "Cross-check your bill against your own readings",
        teaser: "If the billed consumption doesn't match your own weekly log, that gap is worth chasing down.",
        detail: {
          steps: [
            "Compare the KL shown on Current Bill with your own logged readings for that period.",
            "A small rounding difference between the two is normal.",
            "A large, unexplained gap in either direction is worth raising with support before you pay.",
          ],
          related: CURRENT_BILL,
        },
      },
      {
        id: "common-leak-sources",
        icon: "🔍",
        title: "Know where leaks usually hide",
        teaser: "Toilets, water heaters, and outdoor taps account for most hidden household leaks — check these first.",
        detail: {
          steps: [
            "Toilets: a worn flapper valve is the single most common cause of silent water loss.",
            "Water heaters: check the pressure-relief valve and pipe connections for drips.",
            "Outdoor taps and hose fittings: look for wear at the connection point.",
            "Under-sink supply lines: feel for dampness at the shutoff valve and fittings.",
          ],
        },
      },
    ],
  },
  {
    id: "unusual",
    title: "Spotting Unusual Usage",
    subtitle: "Turn a surprise bill into an early warning instead",
    color: "#b45309",
    bg: "#fef3c7",
    icon: "📊",
    tips: [
      {
        id: "daily-trends",
        icon: "📈",
        title: "Check trends daily, not just the bill",
        teaser: "A day that's twice your usual amount is the earliest warning sign — visible weeks before it would show up on a bill.",
        detail: {
          steps: [
            "Open Water Consumption regularly, not only when the bill arrives.",
            "Look for any single day that's roughly double your normal amount.",
            "Investigate it the same week — the earlier you catch it, the smaller the eventual bill impact.",
          ],
          related: WATER_CONSUMPTION,
        },
      },
      {
        id: "compare-building",
        icon: "⇄",
        title: "Compare against your building",
        teaser: "If you're climbing while your neighbours stay flat, the cause is inside your home — not the season.",
        detail: {
          steps: [
            "Open Consumption Comparison to see your usage next to neighbours and the community average.",
            "A rise that everyone shares usually points to weather or a tariff period, not a fault.",
            "A rise that's yours alone almost always has a cause inside your own home.",
          ],
          related: CONSUMPTION_COMPARISON,
        },
      },
      {
        id: "phantom-consumption",
        icon: "🕒",
        title: "Rule out phantom consumption",
        teaser: "Water softeners, smart irrigation timers, and stuck float valves can all draw water on a schedule you never notice.",
        detail: {
          steps: [
            "Check whether a water softener is mid-regeneration cycle.",
            "Check any smart irrigation timer's schedule against the hours usage rose.",
            "Check the float valve in an overhead tank — a stuck valve keeps refilling even when the tank is full.",
          ],
        },
      },
      {
        id: "act-on-alerts",
        icon: "🔔",
        title: "Act on alerts within a day",
        teaser: "High-consumption and potential-leak alerts come straight from your meter data — a small leak compounds fast.",
        detail: {
          impact: "A leak wastes very little in a single day, but the same leak left for a month can rival a whole extra billing tier.",
          steps: [
            "Open the Alerts page as soon as a notification arrives.",
            "Cross-check it against Water Consumption for that day.",
            "Investigate within 24 hours — the cost of a leak grows every day it's left unchecked.",
          ],
          related: ALERTS,
        },
      },
      {
        id: "seasonal-baseline",
        icon: "☀",
        title: "Learn what 'normal' looks like for each season",
        teaser: "Usage naturally shifts with weather and guests — knowing your own pattern stops you chasing a leak that isn't there.",
        detail: {
          steps: [
            "Expect higher use in warmer months from more showers, laundry, and any outdoor watering.",
            "Expect short-term spikes around guests or festivals — these should fall back within a few days.",
            "Use Usage History to compare against the same month last year, if available.",
          ],
          related: USAGE_HISTORY,
        },
      },
      {
        id: "rising-baseline",
        icon: "📉",
        title: "A slowly rising baseline matters more than one spike",
        teaser: "A single unusual day is often explainable. A daily average that keeps creeping up for weeks usually isn't.",
        detail: {
          impact: "This pattern — small, steady, and unexplained — is the classic signature of a slow leak rather than a lifestyle change.",
          steps: [
            "Check your 30-day average on the Dashboard, not just yesterday's figure.",
            "If it has risen for two or more weeks running with no change in routine, treat it as a leak until proven otherwise.",
            "Run the two-hour zero-flow test to confirm.",
          ],
        },
      },
    ],
  },
  {
    id: "reduce",
    title: "Reducing Water Wastage",
    subtitle: "Small habit changes, measurable savings",
    color: "#059669",
    bg: "#d1fae5",
    icon: "💧",
    tips: [
      {
        id: "fix-drips",
        icon: "🩹",
        title: "Fix drips immediately",
        teaser: "A tap dripping once a second wastes around 10,000 litres a year — more than many households use in two months.",
        detail: {
          impact: "10,000 litres a year from one tap — a replacement washer costs very little and takes minutes to fit.",
          steps: [
            "Identify the dripping tap and shut off its isolation valve, or the mains if there isn't one.",
            "Replace the worn washer or O-ring — most taps use a standard, inexpensive size.",
            "Turn the water back on and check the tap is fully dry when closed.",
          ],
        },
      },
      {
        id: "low-flow-aerators",
        icon: "🚿",
        title: "Fit low-flow aerators",
        teaser: "Aerators cut tap flow by up to 50% with no noticeable drop in pressure, and pay for themselves within weeks.",
        detail: {
          steps: [
            "Buy a standard tap aerator that matches your tap's thread size.",
            "Unscrew the existing nozzle and screw the aerator on by hand.",
            "Repeat for every tap in the home — bathroom, kitchen, and utility.",
          ],
        },
      },
      {
        id: "ro-reject-reuse",
        icon: "♻",
        title: "Reuse RO reject water",
        teaser: "A typical RO purifier rejects roughly 2–3 litres for every litre it purifies — don't let it go down the drain.",
        detail: {
          steps: [
            "Connect a bucket or container to the purifier's reject-water outlet.",
            "Use the collected water for mopping floors, flushing, or watering plants.",
            "Empty and refresh it daily so it doesn't stagnate.",
          ],
        },
      },
      {
        id: "full-loads-only",
        icon: "🧺",
        title: "Run full loads only",
        teaser: "Washing machines and dishwashers use nearly as much water for a half load as a full one.",
        detail: {
          steps: [
            "Batch laundry so the machine runs on a full or near-full load each time.",
            "Do the same for the dishwasher rather than running it half-empty.",
            "If a partial load is unavoidable, use the appliance's economy or half-load setting.",
          ],
        },
      },
      {
        id: "shorter-showers",
        icon: "⏳",
        title: "Cut two minutes off your shower",
        teaser: "A standard shower head uses about 8–10 litres a minute — two minutes less saves 15–20 litres every time.",
        detail: {
          impact: "For a family of four, that's easily 60–80 litres saved every single day.",
          steps: [
            "Use a phone timer, or a simple 4-minute sand timer in the bathroom.",
            "Turn the water off while soaping up, then back on just to rinse.",
            "Fit a low-flow shower head for an easy, permanent reduction with no extra effort.",
          ],
        },
      },
      {
        id: "tap-off-while-working",
        icon: "🪥",
        title: "Turn off the tap while you work",
        teaser: "Brushing teeth or hand-washing dishes with the tap left running can waste 6 litres a minute for nothing.",
        detail: {
          impact: "This one habit alone can save a family well over 1,000 litres a month.",
          steps: [
            "Wet what you need, turn the tap off, do the work, then turn it back on to rinse.",
            "Apply it to brushing teeth, shaving, and hand-washing dishes.",
            "Combine with a low-flow aerator for an even bigger effect at no extra cost.",
          ],
        },
      },
    ],
  },
];

/** Modal that shows a tip's full detail. Portalled to <body> so it always sits above page content,
 * independent of any hover/transform context on the cards. */
function TipModal({ pair, visible, onClose, onNavigate }) {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!pair) return undefined;

    const previouslyFocused = document.activeElement;
    closeBtnRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        'button, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [pair, onClose]);

  if (!pair) return null;
  const { cat, tip } = pair;

  return createPortal(
    <div
      className={`mtips-modal-backdrop ${visible ? "show" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`mtips-modal-panel ${visible ? "show" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mtips-modal-title"
        ref={panelRef}
        style={{ "--accent": cat.color }}
      >
        <button type="button" className="mtips-modal-close" onClick={onClose} ref={closeBtnRef} aria-label="Close">
          ✕
        </button>

        <div className="mtips-modal-icon" style={{ background: cat.bg }}>
          <span aria-hidden="true">{tip.icon}</span>
        </div>
        <span className="mtips-modal-tag" style={{ background: cat.bg, color: cat.color }}>
          {cat.title}
        </span>
        <h3 id="mtips-modal-title">{tip.title}</h3>
        <p className="mtips-modal-lead">{tip.teaser}</p>

        {tip.detail?.impact && (
          <div className="mtips-modal-impact">
            <span aria-hidden="true">⚡</span>
            <p>{tip.detail.impact}</p>
          </div>
        )}

        {tip.detail?.steps?.length > 0 && (
          <div className="mtips-modal-steps">
            <h4>How to do it</h4>
            <ol>
              {tip.detail.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        )}

        {tip.detail?.related && (
          <button type="button" className="mtips-modal-related" onClick={() => onNavigate(tip.detail.related.route)}>
            Open {tip.detail.related.label} →
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

function MeterTips() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [activePair, setActivePair] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const openTip = (cat, tip) => {
    clearTimeout(closeTimerRef.current);
    setActivePair({ cat, tip });
    // Double rAF: let the browser paint the entering state first, then flip the class so the
    // CSS transition actually animates instead of jumping straight to "shown".
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  };

  const closeTip = useCallback(() => {
    setModalVisible(false);
    closeTimerRef.current = setTimeout(() => setActivePair(null), 240);
  }, []);

  const goTo = (route) => {
    closeTip();
    navigate(route);
  };

  const handleNavigation = (page) => {
    const routes = {
      Overview: "/resident/dashboard",
      "Water Consumption": "/resident/water-consumption",
      "Usage History": "/resident/usage-history",
      "Meter Details": "/resident/meter-details",
      "Consumption Comparison": "/resident/consumption-comparison",
      "Water Meter Tips": "/resident/meter-tips",
      "Current Bill": "/resident/current-bill",
      "Billing History": "/resident/billing-history",
      "Payment History": "/resident/payment-history",
      Notifications: "/resident/notifications",
      Alerts: "/resident/alerts",
      "My Profile": "/resident/profile",
      "Account Settings": "/resident/settings",
      "Help & Support": "/resident/help",
    };
    if (routes[page]) navigate(routes[page]);
  };

  const handleLogout = () => {
    ["isAuthenticated", "userRole", "accessType", "userEmail", "authToken"].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const tipCount = CATEGORIES.reduce((n, c) => n + c.tips.length, 0);

  return (
    <div className="mtips-page">
      <Sidebar activePage="Water Meter Tips" onNavigate={handleNavigation} onLogout={handleLogout} />

      <main className="mtips-main">
        <Header activePage="Water Meter Tips" />

        <div className="mtips-content">
          {/* PAGE HEADING */}
          <div className="mtips-heading">
            <div>
              <span className="mtips-eyebrow">WATER MANAGEMENT</span>
              <h2>Water Meter Tips</h2>
              <p>
                {tipCount} practical tips for {profile.name} ({profile.apartment}) on reading your meter, catching leaks early, spotting
                unusual usage, and cutting everyday waste. Tap any card for the full how-to.
              </p>
            </div>
          </div>

          {/* QUICK LINKS INTO THE REAL DATA PAGES THESE TIPS REFER TO */}
          <section className="mtips-quicklinks" aria-label="Related pages">
            {QUICK_LINKS.map((q) => (
              <button key={q.route} type="button" className="mtips-quicklink" onClick={() => navigate(q.route)}>
                <span className="mtips-quicklink-icon">{q.icon}</span>
                <span className="mtips-quicklink-text">
                  <strong>{q.label}</strong>
                  <small>{q.desc}</small>
                </span>
                <span className="mtips-quicklink-arrow">→</span>
              </button>
            ))}
          </section>

          {/* TIP CATEGORIES */}
          {CATEGORIES.map((cat) => (
            <section className="mtips-category" key={cat.id} aria-labelledby={`mtips-h-${cat.id}`}>
              <div className="mtips-category-head">
                <span className="mtips-category-badge" style={{ background: cat.bg, color: cat.color }}>
                  {cat.icon}
                </span>
                <div>
                  <h3 id={`mtips-h-${cat.id}`}>{cat.title}</h3>
                  <p>{cat.subtitle}</p>
                </div>
              </div>

              <div className="mtips-grid">
                {cat.tips.map((tip) => (
                  <button
                    type="button"
                    className="mtips-card"
                    key={tip.id}
                    style={{ "--accent": cat.color }}
                    onClick={() => openTip(cat, tip)}
                    aria-haspopup="dialog"
                  >
                    <div className="mtips-card-icon" style={{ background: cat.bg }}>
                      <span aria-hidden="true">{tip.icon}</span>
                    </div>
                    <h4>{tip.title}</h4>
                    <p>{tip.teaser}</p>
                    <span className="mtips-card-more">
                      Tap for details <span aria-hidden="true">→</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {/* CLOSING CALLOUT */}
          <section className="mtips-callout">
            <div>
              <strong>Still seeing something you can't explain?</strong>
              <p>
                If a leak looks like it's outside your own plumbing — for example water only near the meter box — or your meter itself
                seems faulty, don't try to fix it yourself. Raise a ticket and the maintenance team will inspect it.
              </p>
            </div>
            <button type="button" className="mtips-callout-btn" onClick={() => navigate("/resident/help")}>
              Get Help →
            </button>
          </section>
        </div>
      </main>

      <TipModal pair={activePair} visible={modalVisible} onClose={closeTip} onNavigate={goTo} />
    </div>
  );
}

export default MeterTips;
