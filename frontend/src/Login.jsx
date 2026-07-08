import { useState } from "react";
import { login, register } from "./api";

// The login screen. A manager has to log in here before they can see the matcher.
// The same form does both login and register, I just switch a flag to change which one
// runs and what the button says.
function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); // stop the form from reloading the page
    setError("");

    try {
      // call register or login depending on which mode we are in
      const data = isRegister
        ? await register(email, password)
        : await login(email, password);
      // hand the token and email back up to App, which then shows the dashboard
      onLogin(data.token, data.email);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      {/* left panel — dark branded side with logo and tagline */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h1 className="login-brand-title">
            Skill<span>Match</span>
          </h1>
          <p className="login-tagline">
            Right Engineers. Right Projects.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <strong>Intelligent Matching</strong>
                <p>KNN-based engine evaluates 5 dimensions to find the best fit</p>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div>
                <strong>3,000+ Engineers</strong>
                <p>Search across a large synthetic bench of diverse engineers</p>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <strong>Two Match Modes</strong>
                <p>Exact fit for immediate needs, potential fit for planning ahead</p>
              </div>
            </div>
          </div>
        </div>

        {/* decorative dots at the bottom of the left panel */}
        <div className="login-left-dots">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="dot" />
          ))}
        </div>
      </div>

      {/* right panel — the form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2 className="login-heading">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="login-subheading">
            {isRegister
              ? "Register as a manager to start matching engineers"
              : "Sign in to your manager account"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              {/* on the login screen I show the test account in the box as a hint,
                  since this is only a demo login. when registering it goes back to a normal hint. */}
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegister ? "you@company.com" : "manager@skillmatch.com"}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "Create a password" : "password123"}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-submit">
              {isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          {/* small link to flip between login and register */}
          <p className="login-switch">
            {isRegister ? "Already have an account?" : "New manager?"}{" "}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
              {isRegister ? "Sign in" : "Create one"}
            </span>
          </p>

          {!isRegister && (
            <div className="login-demo-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Demo account: <strong>manager@skillmatch.com</strong> / <strong>password123</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
