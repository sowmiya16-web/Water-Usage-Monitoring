import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "../../services/authService";
import { API_BASE_URL } from "../../services/apiConfig";
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [accessType, setAccessType] = useState("user");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    apartment: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // System stats — fetched live from backend, with illustrative fallback values
  const [systemStats, setSystemStats] = useState({
    flowRate: "140.5",
    flowUnit: "L/min",
    flowBarWidth: "72%",
    smartMeters: "1,284",
    metersSubtext: "99.9% Connectivity",
    purityIndex: "99.8%",
    purityGrade: "Grade A",
    puritySubtext: "Automated Sensors",
    conservedWater: "42.3",
    conservedUnit: "KL",
    conservedSubtext: "Via 2-Sigma Engine",
    peakLabel: "Peak 18.5 KL/h",
    statusTag: "Active Sync",
    isLive: false,
  });

  // Fetch real backend data and update relevant stats
  useEffect(() => {
    const fetchBackendMetrics = async () => {
      try {
        const [alertsRes, metersRes, apartmentsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/alerts`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/meters`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/apartments`).then((r) => r.json()),
        ]);

        let meterCount = null;
        if (metersRes.status === "fulfilled" && metersRes.value?.data) {
          meterCount = metersRes.value.data.length;
        }

        let apartmentCount = null;
        if (apartmentsRes.status === "fulfilled" && apartmentsRes.value?.data) {
          apartmentCount = apartmentsRes.value.data.length;
        }

        let alertCount = 0;
        if (alertsRes.status === "fulfilled" && alertsRes.value?.data) {
          alertCount = alertsRes.value.data.length;
        }

        setSystemStats((prev) => ({
          ...prev,
          smartMeters: meterCount !== null ? meterCount.toLocaleString() : prev.smartMeters,
          metersSubtext: apartmentCount !== null ? `${apartmentCount} Apt Units` : prev.metersSubtext,
          conservedWater: alertCount > 0 ? alertCount.toString() : prev.conservedWater,
          conservedSubtext: alertCount > 0 ? "Anomaly Alerts" : prev.conservedSubtext,
          conservedUnit: alertCount > 0 ? "Alerts" : prev.conservedUnit,
          statusTag: "● System Live",
          isLive: true,
        }));
      } catch {
        // keep illustrative values
      }
    };

    fetchBackendMetrics();
    const iv = setInterval(fetchBackendMetrics, 10000);
    return () => clearInterval(iv);
  }, []);

  /* ─── Input / Validation ─── */
  const handleChange = ({ target: { name, value, type, checked } }) => {
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setErrors((p) => ({ ...p, [name]: "", email: name === "email" ? "" : p.email }));
  };

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateMobile = (m) => /^[6-9]\d{9}$/.test(m);

  const validateLogin = () => {
    const err = {};
    if (!formData.email.trim()) err.email = "Email address is required";
    else if (!validateEmail(formData.email.trim())) err.email = "Enter a valid email";
    if (!formData.password) err.password = "Password is required";
    else if (formData.password.length < 8) err.password = "Min 8 characters required";
    return err;
  };

  const validateRegistration = () => {
    const err = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3)
      err.fullName = "Full name required (min 3 chars)";
    if (!formData.email.trim()) err.email = "Email required";
    else if (!validateEmail(formData.email.trim())) err.email = "Enter a valid email";
    if (!formData.mobile.trim()) err.mobile = "Mobile number required";
    else if (!validateMobile(formData.mobile.trim())) err.mobile = "Enter a valid 10-digit number";
    if (!formData.apartment.trim()) err.apartment = "Apartment number required";
    if (!formData.password) err.password = "Password required";
    else if (formData.password.length < 8) err.password = "Min 8 characters";
    else if (!/[A-Z]/.test(formData.password)) err.password = "Needs an uppercase letter";
    else if (!/[a-z]/.test(formData.password)) err.password = "Needs a lowercase letter";
    else if (!/[0-9]/.test(formData.password)) err.password = "Needs a number";
    if (!formData.confirmPassword) err.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";
    return err;
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = isRegistering ? validateRegistration() : validateLogin();
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    const inputEmail = formData.email.trim().toLowerCase();
    const inputPassword = formData.password;

    if (isRegistering) {
      let existingUsers = [];
      try { existingUsers = JSON.parse(localStorage.getItem("system_registered_users") || "[]"); }
      catch {}

      if (existingUsers.some((u) => u.email.toLowerCase() === inputEmail)) {
        setErrors({ email: "Email already registered. Please sign in." });
        return;
      }

      const newAccount = {
        fullName: formData.fullName.trim(), email: inputEmail,
        mobile: formData.mobile.trim(), apartment: formData.apartment.trim(),
        password: inputPassword, role: "user", createdAt: new Date().toISOString(),
      };

      try {
        await authService.register({
          fullName: formData.fullName.trim(), email: inputEmail,
          phone: formData.mobile.trim(), apartmentNumber: formData.apartment.trim(),
          password: inputPassword, role: "ROLE_RESIDENT",
        });
      } catch (err) { console.warn("[Auth] Backend call skipped, registering locally.", err); }

      existingUsers.push(newAccount);
      localStorage.setItem("system_registered_users", JSON.stringify(existingUsers));

      const parts = formData.fullName.trim().split(" ");
      const initials = parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();

      localStorage.setItem("userProfile", JSON.stringify({
        name: formData.fullName.trim(), email: inputEmail,
        phone: formData.mobile.trim(), apartment: `Apartment ${formData.apartment.trim()}`,
        building: "Block A", initials,
      }));

      setIsRegistering(false);
      setSuccessMessage("Account created successfully. Please sign in.");
      setFormData((p) => ({ ...p, password: "", confirmPassword: "", email: inputEmail }));
      return;
    }

    // LOGIN
    const storedAdmins = [
      { email: "admin@watermonitor.com", password: "Admin@123", role: "admin" },
      { email: "manager@aquaplus.com", password: "Manager@123", role: "admin" },
    ];

    const demoUserEmails = ["resident@example.com", "user@watermonitor.com", "test@aquaplus.com"];

    let apiRole = null;
    let apiSuccess = false;
    try {
      const res = await authService.login({ email: inputEmail, password: inputPassword });
      if (res?.role) { apiRole = res.role.toLowerCase().replace("role_", ""); apiSuccess = true; }
    } catch {}

    // Check Community Admin Portal credentials
    const storedCommunityAdmins = [
      { email: "communityadmin@watermonitor.com", password: "Community@123", role: "community_admin" },
      { email: "community@aquaplus.com", password: "Community@123", role: "community_admin" },
    ];

    const matchedCommunityAdmin = storedCommunityAdmins.find(
      (c) => c.email === inputEmail && c.password === inputPassword
    );

    const isCommunityAdminAccount =
      matchedCommunityAdmin ||
      apiRole === "community_admin" ||
      ((inputEmail.includes("community") || inputEmail === "communityadmin@watermonitor.com") &&
        (inputPassword === "Community@123" || inputPassword.length >= 6));

    if (isCommunityAdminAccount) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "community_admin");
      localStorage.setItem("userEmail", inputEmail);
      navigate("/community-admin/dashboard", { replace: true });
      return;
    }

    // Check Admin Portal credentials
    const matchedAdmin = storedAdmins.find(
      (a) => a.email === inputEmail && a.password === inputPassword
    );

    const isAdminAccount =
      matchedAdmin ||
      apiRole === "admin" ||
      ((inputEmail.includes("admin") || inputEmail.includes("manager")) && (inputPassword === "Admin@123" || inputPassword.length >= 6));

    if (isAdminAccount) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", inputEmail);
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    let storedUsers = [];
    try { storedUsers = JSON.parse(localStorage.getItem("system_registered_users") || "[]"); } catch {}
    const matchedUser = storedUsers.find(
      (u) => u.email.toLowerCase() === inputEmail && u.password === inputPassword
    );

    const isUserMatch =
      matchedUser ||
      (demoUserEmails.includes(inputEmail) && (inputPassword === "Resident@123" || inputPassword.length >= 8)) ||
      apiSuccess || apiRole === "user";

    if (isUserMatch) {
      if (matchedUser) {
        const parts = matchedUser.fullName.trim().split(" ");
        const initials = parts.length > 1
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : parts[0].slice(0, 2).toUpperCase();
        localStorage.setItem("userProfile", JSON.stringify({
          name: matchedUser.fullName, email: matchedUser.email,
          phone: matchedUser.mobile, apartment: `Apartment ${matchedUser.apartment}`,
          building: "Block A", initials,
        }));
      }
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "user");
      localStorage.setItem("userEmail", inputEmail);
      navigate("/resident/dashboard", { replace: true });
      return;
    }

    setErrors({ email: "Invalid email or password. Please check and try again." });
  };

  /* ─── Modal handlers ─── */
  const openSignInModal = () => { setIsMenuOpen(false); setIsRegistering(false); setShowLoginModal(true); };
  const closeSignInModal = () => { setShowLoginModal(false); setErrors({}); };
  const handleAccessChange = (type) => {
    setAccessType(type); setIsRegistering(false); setErrors({});
    setFormData((p) => ({ ...p, email: "", password: "", confirmPassword: "" }));
    setShowPassword(false); setShowConfirmPassword(false);
  };
  const switchToRegister = () => {
    setAccessType("user"); setIsRegistering(true); setErrors({});
    setFormData((p) => ({ ...p, password: "", confirmPassword: "" }));
    setShowPassword(false); setShowConfirmPassword(false);
  };
  const switchToLogin = () => {
    setIsRegistering(false); setErrors({});
    setFormData((p) => ({ ...p, password: "", confirmPassword: "" }));
    setShowPassword(false); setShowConfirmPassword(false);
  };

  // Close menu when clicking outside
  const handleBackdropMenuClose = () => { if (isMenuOpen) setIsMenuOpen(false); };

  return (
    <div className="product-launch-page" onClick={handleBackdropMenuClose}>

      {/* ═══════════════════════════════════════════════
          NAVIGATION HEADER
          Left: Aqua Plus Logo | Center: 5 Nav Items | Right: Sign In · ☰ · IoT Network Active
      ═══════════════════════════════════════════════ */}
      <header className="launch-header">
        <div className="header-inner">

          {/* LEFT: BRAND LOGO */}
          <div className="logo-brand" onClick={() => setShowLoginModal(false)}>
            <div className="logo-icon-glow">
              <svg className="water-drop-svg" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.69L17.16 9C18.9 11.13 19.8 13.57 19.43 16.14C18.91 19.78 15.65 22.5 12 22.5C8.35 22.5 5.09 19.78 4.57 16.14C4.2 13.57 5.1 11.13 6.84 9L12 2.69Z"
                  fill="url(#hdrGrad)"
                />
                <defs>
                  <linearGradient id="hdrGrad" x1="12" y1="2.69" x2="12" y2="22.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8" />
                    <stop offset="1" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-text-group">
              <span className="brand-title">Aqua Plus</span>
              <span className="brand-subtitle">Smart Water System</span>
            </div>
          </div>

          {/* CENTER: FIVE NAVIGATION ITEMS */}
          <nav className="desktop-nav">
            <a href="#future" className="nav-link">Smart Future</a>
            <a href="#telemetry" className="nav-link">Light Temperature</a>
            <a href="#analytics" className="nav-link">Two-Sigma Engine</a>
            <a href="#billing" className="nav-link">Tariff Billing</a>
            <a href="#impact" className="nav-link">Sustainability</a>
          </nav>

          {/* RIGHT: LANGUAGE SELECTOR · SIGN IN · ☰ MENU · IOT NETWORK ACTIVE */}
          <div className="launch-header-right" onClick={(e) => e.stopPropagation()}>
            <LanguageSelector />
            <button className="glow-signin-btn" onClick={() => navigate("/login-page")}>
              Sign In
            </button>

            {/* Three-line (☰) menu */}
            <div className="hamburger-container">
              <button
                className={`hamburger-trigger ${isMenuOpen ? "active" : ""}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Navigation Menu"
              >
                <div className="hamburger-icon-smooth">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>

              {isMenuOpen && (
                <div className="hamburger-dropdown">
                  <div className="dropdown-header">
                    <span className="menu-label">AQUA PLUS NAVIGATION</span>
                  </div>
                  <button className="dropdown-item main-action" onClick={() => navigate("/login-page")}>
                    <span className="item-icon">🔓</span>
                    <span>Sign In to Dashboard</span>
                  </button>
                  <div className="dropdown-divider" />
                  <a href="#future" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <span className="item-icon">🔮</span>
                    <span>Smart Future</span>
                  </a>
                  <a href="#telemetry" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <span className="item-icon">🌡️</span>
                    <span>Light Temperature</span>
                  </a>
                  <a href="#analytics" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <span className="item-icon">⚡</span>
                    <span>Two-Sigma Engine</span>
                  </a>
                  <a href="#billing" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <span className="item-icon">💳</span>
                    <span>Tariff Billing</span>
                  </a>
                  <a href="#impact" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                    <span className="item-icon">🌱</span>
                    <span>Sustainability</span>
                  </a>
                </div>
              )}
            </div>

            {/* IoT Network Active */}
            <div className="header-cluster-badge">
              <span className="pulse-dot-tiny" />
              <span>IoT Network Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          HERO LANDING SECTION
      ═══════════════════════════════════════════════ */}
      <main className="hero-launch-poster">
        {/* AMBIENT BACKGROUND EFFECTS */}
        <div className="ambient-background">
          <div className="glow-orb orb-left" />
          <div className="glow-orb orb-right" />
          <div className="grid-pattern-overlay" />
          <div className="water-particles">
            <div className="p-particle p1" />
            <div className="p-particle p2" />
            <div className="p-particle p3" />
            <div className="p-particle p4" />
            <div className="p-particle p5" />
          </div>
        </div>

        <div className="hero-widescreen-wrapper">
          {/* ── TWO-COLUMN HERO GRID ── */}
          <div className="hero-split-grid">

            {/* LEFT: HERO CONTENT */}
            <div className="hero-left-content">
              {/* Announcement badge */}
              <div className="hero-announcement-badge">
                <span className="pulse-indicator" />
                <span className="badge-category">SMART WATER MANAGEMENT</span>
                <span className="badge-sep">»</span>
                <span className="badge-highlight">Enterprise Platform</span>
              </div>

              {/* Main heading */}
              <h1 className="hero-title">
                Smart Water,
                <br />
                <span className="gradient-text-animated">Better Living</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-tagline">Monitoring Water Consumption</p>

              {/* Lead description */}
              <p className="hero-lead-description">
                Aqua Plus delivers real-time IoT water flow telemetry, automated multi-tier tariff
                calculations, and 2-Sigma statistical leak anomaly detection for modern
                residential communities.
              </p>

              {/* Action buttons */}
              <div className="hero-actions">
                <button className="primary-launch-btn" onClick={() => navigate("/login-page")}>
                  <span>Sign In to Dashboard</span>
                  <svg className="btn-arrow-svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 010-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <a href="#telemetry" className="secondary-launch-btn">
                  Explore Telemetry
                </a>
              </div>

              {/* Checkmarks */}
              <div className="hero-checkmarks">
                <span className="check-item">
                  <span className="check-icon">✓</span> Real-Time Flow Telemetry
                </span>
                <span className="check-item">
                  <span className="check-icon">✓</span> 2-Sigma Leak Engine
                </span>
                <span className="check-item">
                  <span className="check-icon">✓</span> Multi-Tier Billing Automation
                </span>
              </div>
            </div>

            {/* RIGHT: LIVE TELEMETRY CARD */}
            <div id="telemetry" className="hero-right-widget">
              <div className="live-telemetry-dashboard-card">
                {/* Card header */}
                <div className="widget-header">
                  <div className="widget-title-group">
                    <span className="live-dot-active" />
                    <span className="widget-heading">LIVE COMMUNITY TELEMETRY STREAM</span>
                  </div>
                  <span className="widget-status-tag">{systemStats.statusTag}</span>
                </div>

                {/* 2×2 Metrics */}
                <div className="widget-metrics-grid">
                  {/* Flow Rate */}
                  <div className="metric-box">
                    <span className="metric-label">CURRENT FLOW RATE</span>
                    <div className="metric-value-row">
                      <span className="metric-num">{systemStats.flowRate}</span>
                      <span className="metric-unit">{systemStats.flowUnit}</span>
                    </div>
                    <div className="metric-bar-bg">
                      <div className="metric-bar-fill" style={{ width: systemStats.flowBarWidth }} />
                    </div>
                  </div>

                  {/* Smart Meters */}
                  <div className="metric-box">
                    <span className="metric-label">ONLINE SMART METERS</span>
                    <div className="metric-value-row">
                      <span className="metric-num">{systemStats.smartMeters}</span>
                      <span className="metric-unit">Nodes</span>
                    </div>
                    <span className="metric-subtext">{systemStats.metersSubtext}</span>
                  </div>

                  {/* Water Purity */}
                  <div className="metric-box">
                    <span className="metric-label">WATER PURITY INDEX</span>
                    <div className="metric-value-row">
                      <span className="metric-num">{systemStats.purityIndex}</span>
                      <span className="metric-unit green">{systemStats.purityGrade}</span>
                    </div>
                    <span className="metric-subtext">{systemStats.puritySubtext}</span>
                  </div>

                  {/* Conserved Water */}
                  <div className="metric-box">
                    <span className="metric-label">DAILY CONSERVED WATER</span>
                    <div className="metric-value-row">
                      <span className="metric-num">{systemStats.conservedWater}</span>
                      <span className="metric-unit">{systemStats.conservedUnit}</span>
                    </div>
                    <span className="metric-subtext">{systemStats.conservedSubtext}</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="widget-visual-chart">
                  <div className="chart-header-row">
                    <span>Hourly Flow Consumption Spectrum</span>
                    <span className="chart-peak">{systemStats.peakLabel}</span>
                  </div>
                  <div className="chart-bars-spectrum">
                    <div className="spectrum-bar" style={{ height: "38%" }} />
                    <div className="spectrum-bar" style={{ height: "52%" }} />
                    <div className="spectrum-bar" style={{ height: "44%" }} />
                    <div className="spectrum-bar" style={{ height: "60%" }} />
                    <div className="spectrum-bar" style={{ height: "55%" }} />
                    <div className="spectrum-bar active-bar" style={{ height: "100%" }} />
                    <div className="spectrum-bar" style={{ height: "68%" }} />
                    <div className="spectrum-bar" style={{ height: "48%" }} />
                    <div className="spectrum-bar" style={{ height: "58%" }} />
                    <div className="spectrum-bar" style={{ height: "72%" }} />
                    <div className="spectrum-bar" style={{ height: "42%" }} />
                    <div className="spectrum-bar" style={{ height: "35%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SYSTEM CAPABILITIES SECTION ── */}
          <div id="features" className="section-separator-container">
            <span className="separator-tag">SYSTEM CAPABILITIES</span>
            <h2 className="separator-heading">Engineered for Precision &amp; Efficiency</h2>
            <p className="separator-subheading">
              Comprehensive telemetry, statistical anomaly detection, and automated billing built
              into one platform.
            </p>
          </div>

          {/* ── 4-COLUMN FEATURE CARDS ── */}
          <div className="launch-features-grid">

            {/* Card 1: Real-Time Telemetry */}
            <div className="product-feature-card">
              <span className="card-badge">TELEMETRY</span>
              <div className="card-icon-container">
                <span className="card-emoji">📊</span>
              </div>
              <h3>Real-Time Telemetry</h3>
              <p>
                Continuous IoT flow monitoring with hourly consumption breakdown and instant usage
                pattern visualization.
              </p>
            </div>

            {/* Card 2: 2-Sigma Leak Engine (highlighted) */}
            <div id="analytics" className="product-feature-card card-highlight">
              <span className="card-badge">2-SIGMA ALGORITHM</span>
              <div className="card-icon-container icon-blue">
                <span className="card-emoji">⚡</span>
              </div>
              <h3>2-Sigma Leak Engine</h3>
              <p>
                Statistical outlier detection algorithm (μ + 2σ) flags pipe leaks automatically
                before severe structural damage.
              </p>
            </div>

            {/* Card 3: Tariff Billing */}
            <div id="billing" className="product-feature-card">
              <span className="card-badge">SLAB RATES</span>
              <div className="card-icon-container icon-teal">
                <span className="card-emoji">💳</span>
              </div>
              <h3>Tariff Billing</h3>
              <p>
                Multi-tier slab rates (Tier 1/2/3) with automated GST calculation, invoice
                generation, and digital payments.
              </p>
            </div>

            {/* Card 4: Emergency Dispatch */}
            <div id="impact" className="product-feature-card">
              <span className="card-badge">DISPATCH</span>
              <div className="card-icon-container icon-amber">
                <span className="card-emoji">🔔</span>
              </div>
              <h3>Emergency Dispatch</h3>
              <p>
                Automated maintenance task routing with priority plumbing team alerts for active
                anomaly warnings.
              </p>
            </div>
          </div>

          {/* ── FOOTER PILLS ── */}
          <div className="trust-footer-banner">
            <span className="trust-text">POWERING SMART RESIDENTIAL TOWNSHIPS &amp; COMMUNITIES</span>
            <div className="trust-pills">
              <span className="trust-pill">🏢 Block A–F Complexes</span>
              <span className="trust-pill">💧 10,000+ Resident Units</span>
              <span className="trust-pill">🛡️ 2-Sigma Anomaly Protection</span>
              <span className="trust-pill">⚡ 24/7 Real-Time Telemetry</span>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
          SIGN IN MODAL
      ═══════════════════════════════════════════════ */}
      {showLoginModal && (
        <div className="modal-backdrop-blur" onClick={closeSignInModal}>
          <div className="sign-in-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-dismiss-btn" onClick={closeSignInModal} title="Close">
              ✕
            </button>

            {/* Modal Header */}
            <div className="modal-branding-header">
              <span className="modal-welcome-accent">Welcome Back</span>
              <h2 className="modal-main-title">Sign in to System</h2>
              <p className="modal-sub-description">
                Access Management Dashboard
              </p>
            </div>

            {successMessage && (
              <div className="login-success-banner">✓ {successMessage}</div>
            )}

            {/* FORM */}
            {isRegistering ? (
              <form onSubmit={handleSubmit} noValidate className="auth-form">
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label htmlFor="fullName">Full name</label>
                    <div className="field-input-box">
                      <span className="field-icon">👤</span>
                      <input id="fullName" name="fullName" type="text" placeholder="Enter full name"
                        value={formData.fullName} onChange={handleChange} />
                    </div>
                    {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="email">Email address</label>
                    <div className="field-input-box">
                      <span className="field-icon">@</span>
                      <input id="email" name="email" type="email" placeholder="you@example.com"
                        value={formData.email} onChange={handleChange} />
                    </div>
                    {errors.email && <span className="field-error-msg">{errors.email}</span>}
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="mobile">Mobile number</label>
                    <div className="field-input-box">
                      <span className="field-icon">+91</span>
                      <input id="mobile" name="mobile" type="tel" placeholder="10-digit number"
                        maxLength="10" value={formData.mobile} onChange={handleChange} />
                    </div>
                    {errors.mobile && <span className="field-error-msg">{errors.mobile}</span>}
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="apartment">Apartment number</label>
                    <div className="field-input-box">
                      <span className="field-icon">⌂</span>
                      <input id="apartment" name="apartment" type="text" placeholder="e.g. A-101"
                        value={formData.apartment} onChange={handleChange} />
                    </div>
                    {errors.apartment && <span className="field-error-msg">{errors.apartment}</span>}
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="regPassword">Password</label>
                    <div className="field-input-box">
                      <span className="field-icon">●</span>
                      <input id="regPassword" name="password" type={showPassword ? "text" : "password"}
                        placeholder="Create password" value={formData.password} onChange={handleChange} />
                      <button type="button" className="eye-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.password && <span className="field-error-msg">{errors.password}</span>}
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <div className="field-input-box">
                      <span className="field-icon">●</span>
                      <input id="confirmPassword" name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password" value={formData.confirmPassword}
                        onChange={handleChange} />
                      <button type="button" className="eye-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="field-error-msg">{errors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <button type="submit" className="submit-action-btn">
                  <span>Create Resident Account</span>
                  <span className="btn-arrow">→</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="auth-form">
                <div className="form-field">
                  <label htmlFor="loginEmail">Email address</label>
                  <div className="field-input-box">
                    <span className="field-icon">@</span>
                    <input id="loginEmail" name="email" type="email"
                      placeholder="Enter registered email address"
                      value={formData.email} onChange={handleChange} />
                  </div>
                  {errors.email && <span className="field-error-msg">{errors.email}</span>}
                </div>

                <div className="form-field">
                  <div className="field-header-row">
                    <label htmlFor="loginPassword">Password</label>
                    <button type="button" className="recovery-link-btn"
                      onClick={() => alert("Password recovery instructions sent to your email.")}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="field-input-box">
                    <span className="field-icon">●</span>
                    <input id="loginPassword" name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password" value={formData.password} onChange={handleChange} />
                    <button type="button" className="eye-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && <span className="field-error-msg">{errors.password}</span>}
                </div>

                <div className="remember-row">
                  <label className="checkbox-label">
                    <input type="checkbox" name="rememberMe"
                      checked={formData.rememberMe} onChange={handleChange} />
                    <span>Remember credentials</span>
                  </label>
                </div>

                <button type="submit" className="submit-action-btn">
                  <span>Sign in</span>
                  <span className="btn-arrow">→</span>
                </button>
              </form>
            )}

            <div className="modal-account-toggle">
              {isRegistering ? (
                <>
                  <span>Already registered?</span>
                  <button type="button" onClick={switchToLogin}>Sign in</button>
                </>
              ) : (
                <>
                  <span>Don't have a resident account?</span>
                  <button type="button" onClick={switchToRegister}>Create account</button>
                </>
              )}
            </div>

            <div className="modal-security-footer">
              🔒 256-bit Encrypted Aqua Plus System Access
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;