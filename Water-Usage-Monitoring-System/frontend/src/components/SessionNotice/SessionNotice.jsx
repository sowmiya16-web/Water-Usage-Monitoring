import { useNavigate } from "react-router-dom";

const KEYS = ["isAuthenticated", "userRole", "accessType", "userEmail", "authToken"];

// Shown when a resident API call fails. A 401/403 means the current login can't use resident data
// (an admin account, an expired session, or an offline demo login with no token), so offer to sign in again.
export default function SessionNotice({ error, onRetry, what = "this page" }) {
  const navigate = useNavigate();
  if (!error) return null;

  const denied = error.status === 401 || error.status === 403;
  const email = localStorage.getItem("userEmail");
  const hasToken = !!localStorage.getItem("authToken");

  const signInAgain = () => {
    KEYS.forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  return (
    <div className="rd-state rd-state-error" role="alert">
      {denied ? (
        <>
          <strong>⚠️ Your current sign-in can't open {what}.</strong>
          <p className="rd-state-detail">
            {hasToken
              ? `${email ? `You're signed in as ${email}, which isn't a resident account, or your session has expired.` : "Your session has expired or isn't a resident account."}`
              : "You're signed in without a server session (for example, the server was offline when you logged in)."}{" "}
            Please sign in again with a resident account.
          </p>
          <div className="rd-state-actions">
            <button type="button" className="rd-btn-primary rd-btn-solid" onClick={signInAgain}>
              Sign in as a resident
            </button>
            {onRetry && (
              <button type="button" className="rd-link" onClick={onRetry}>
                Try again
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <strong>⚠️ {error.message || `Couldn't load ${what}.`}</strong>
          <p className="rd-state-detail">The server may be busy or offline. Check that the backend is running, then try again.</p>
          {onRetry && (
            <div className="rd-state-actions">
              <button type="button" className="rd-btn-primary rd-btn-solid" onClick={onRetry}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
