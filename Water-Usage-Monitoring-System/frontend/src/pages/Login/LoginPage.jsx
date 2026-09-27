import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useProfile } from "../../context/ProfileContext";
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();

  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notice, setNotice] = useState("");

  /* ─── Input handlers ─── */
  const handleChange = ({ target: { name, value, type, checked } }) => {
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  /* ─── Validation ─── */
  const validate = () => {
    const err = {};
    if (!formData.email.trim()) err.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      err.email = "Enter a valid email address";
    if (!formData.password) err.password = "Password is required";
    else if (isRegistering && formData.password.length < 8) err.password = "Minimum 8 characters required";
    else if (!isRegistering && formData.password.length < 6) err.password = "Minimum 6 characters required";
    return err;
  };

  /* ─── Submit & Automatic Role Detection ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setNotice("");
    const inputEmail = formData.email.trim().toLowerCase();
    const inputPassword = formData.password;

    /* Create account: email + password only, saved in the database. */
    if (isRegistering) {
      try {
        await authService.register({ email: inputEmail, password: inputPassword, role: "ROLE_RESIDENT" });
        setIsRegistering(false);
        setFormData({ email: inputEmail, password: "", rememberMe: false });
        setNotice("Account created. Sign in with your email and password to continue.");
      } catch (err) {
        setErrors({ email: err.message || "Could not create the account. Please try again." });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      /* Backend authentication with Spring Boot (generates a real JWT with the role).
         There is deliberately no client-side "fallback" login here: a fallback that
         fakes success without ever getting a token used to leave the app looking
         signed in while every real API call silently 403'd — the worst possible
         failure mode, since it looks like a broken dashboard rather than a login
         error. If the backend can't be reached or rejects the credentials, the user
         needs to see that clearly, right here, not three screens later. */
      const res = await authService.login({ email: inputEmail, password: inputPassword });
      if (res?.success && res?.data) {
        const targetDashboard = res.data.targetDashboard;
        // Show the registered email (used for payment receipts) in the portal.
        updateProfile({ email: res.data.email, ...(res.data.fullName ? { name: res.data.fullName } : {}) });
        const role = (res.data.role || "").toLowerCase().replace("role_", "");

        if (targetDashboard) {
          navigate(targetDashboard, { replace: true });
          return;
        }

        if (role === "community_admin") {
          navigate("/community-admin/dashboard", { replace: true });
          return;
        }
        if (role === "admin" || role === "property_admin") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
        navigate("/resident/dashboard", { replace: true });
        return;
      }
      setErrors({ email: "Invalid email or password. Please check and try again." });
    } catch (apiErr) {
      setErrors({
        email:
          typeof apiErr?.status === "number"
            ? apiErr.message || "Invalid email or password. Please check and try again."
            : "Could not reach the server. Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="lp-left">
        {/* Animated water background */}
        <div className="lp-left-bg">
          <div className="lp-orb lp-orb1" />
          <div className="lp-orb lp-orb2" />
          <div className="lp-grid-overlay" />
        </div>

        <div className="lp-left-content">
          {/* Brand */}
          <div className="lp-brand" onClick={() => navigate("/login")}>
            <div className="lp-brand-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.69L17.16 9C18.9 11.13 19.8 13.57 19.43 16.14C18.91 19.78 15.65 22.5 12 22.5C8.35 22.5 5.09 19.78 4.57 16.14C4.2 13.57 5.1 11.13 6.84 9L12 2.69Z"
                  fill="url(#lpDropGrad)"
                />
                <defs>
                  <linearGradient id="lpDropGrad" x1="12" y1="2.69" x2="12" y2="22.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7FDBFF" />
                    <stop offset="1" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="lp-brand-name">SMART WATER MANAGEMENT</span>
          </div>

          {/* Headline */}
          <div className="lp-headline">
            <h1>
              Smarter water.<br />
              Better living.
            </h1>
            <p>
              Monitor water consumption, manage automated billing, and
              build a more efficient and sustainable community.
            </p>
          </div>

          {/* Features */}
          <ul className="lp-features">
            <li>
              <span className="lp-feat-icon lp-feat-teal">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </span>
              <div>
                <strong>Smart Monitoring</strong>
                <span>Track water consumption in real time.</span>
              </div>
            </li>
            <li>
              <span className="lp-feat-icon lp-feat-cyan">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2H6zm1 5a1 1 0 011-1h.01a1 1 0 010 2H8a1 1 0 01-1-1zm4 0a1 1 0 011-1h.01a1 1 0 010 2H12a1 1 0 01-1-1z" />
                </svg>
              </span>
              <div>
                <strong>Automated Billing</strong>
                <span>Calculate and manage water bills easily.</span>
              </div>
            </li>
            <li>
              <span className="lp-feat-icon lp-feat-blue">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <strong>Usage Alerts</strong>
                <span>Identify unusual water consumption.</span>
              </div>
            </li>
          </ul>

          {/* Status pill */}
          <div className="lp-status-pill">
            <span className="lp-live-dot" />
            <span>Smart community water management</span>
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="lp-right">
        <div className="lp-form-card">

          {/* Top actions: Back to home and LanguageSelector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <button className="lp-back-btn" onClick={() => navigate("/login")}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 010 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
            <LanguageSelector variant="header-variant" />
          </div>

          {/* Heading */}
          <div className="lp-form-header">
            <span className="lp-welcome-tag">{isRegistering ? "GET STARTED" : "WELCOME BACK"}</span>
            <h2>{isRegistering ? "Create your account" : "Sign in into System"}</h2>
            <p>{isRegistering ? "Register with your email and a password" : "Access with Smart Automation"}</p>
            {notice && <p style={{ color: "#047857", fontWeight: 600, marginTop: 8 }}>{notice}</p>}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="lp-form">

            {/* Email */}
            <div className="lp-field">
              <label htmlFor="lp-email">Email Address</label>
              <div className={`lp-input-wrap ${errors.email ? "lp-input-err" : ""}`}>
                <span className="lp-input-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <input
                  id="lp-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="lp-err-msg">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="lp-field">
              <div className="lp-field-header">
                <label htmlFor="lp-password">Password</label>
                {!isRegistering && (
                  <button
                    type="button"
                    className="lp-forgot-btn"
                    onClick={() => alert("Password recovery email sent.")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className={`lp-input-wrap ${errors.password ? "lp-input-err" : ""}`}>
                <span className="lp-input-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  id="lp-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isRegistering ? "Create a password (min 8 characters)" : "Enter your password"}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="lp-err-msg">{errors.password}</span>}
            </div>

            {/* Remember Me */}
            {!isRegistering && (
              <label className="lp-remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
            )}

            {/* Submit */}
            <button type="submit" className="lp-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="lp-spinner" />
              ) : (
                <>
                  {isRegistering ? "Create Account" : "Sign In"}
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 010-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Create account */}
          <p className="lp-register-hint">
            {isRegistering ? "Already have an account? " : "Don't have a resident account? "}
            <button
              type="button"
              className="lp-create-btn"
              onClick={() => {
                setIsRegistering((v) => !v);
                setErrors({});
                setNotice("");
                setFormData((p) => ({ ...p, password: "" }));
              }}
            >
              {isRegistering ? "Sign in" : "Create account"}
            </button>
          </p>

          {/* Footer */}
          <div className="lp-form-footer">
            <span>Secure access</span>
            <span className="lp-dot-sep">·</span>
            <span>Water Management Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
