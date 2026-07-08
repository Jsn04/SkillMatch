import { useState } from "react";
import { login, register } from "./api";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4263eb", marginRight: "6px" }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

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
      {/* left panel — dark branded side with logo and flowchart */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo-text">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>Skill<strong>Match</strong></span>
          </div>
          <h1 className="login-brand-title">
            Right Engineers.<br />Right Projects.
          </h1>
          <p className="login-tagline">
            SkillMatch uses intelligent matching to connect the right engineers with the right projects.
          </p>

          <div className="login-flowchart">
            {/* Left box */}
            <div className="flow-card req-card">
              <div className="req-header">
                <div className="req-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <span>Project Requirements</span>
              </div>
              <ul className="req-list">
                <li><CheckIcon /> React, Node.js, AWS</li>
                <li><CheckIcon /> Senior Level</li>
                <li><CheckIcon /> FinTech Domain</li>
                <li><CheckIcon /> Timezone Overlap: 3+ hrs</li>
                <li><CheckIcon /> Availability: Immediate</li>
              </ul>
            </div>

            {/* Connecting lines & Brain */}
            <div className="flow-center">
              <div className="flow-line-left"></div>
              <div className="brain-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                </svg>
              </div>
              <div className="flow-line-right-wrapper">
                <svg className="flow-lines-svg" preserveAspectRatio="none" viewBox="0 0 50 200">
                  <path d="M 0 100 C 25 100, 25 15, 50 15" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                  <path d="M 0 100 C 25 100, 25 71, 50 71" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                  <path d="M 0 100 C 25 100, 25 129, 50 129" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                  <path d="M 0 100 C 25 100, 25 185, 50 185" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                </svg>
              </div>
            </div>

            {/* Candidates */}
            <div className="flow-candidates">
              <div className="cand-card">
                <div className="cand-avatar">AM</div>
                <div className="cand-info">
                  <strong>Arjun Mehta</strong>
                  <span>Senior Engineer</span>
                  <span className="cand-match text-green">93% Match</span>
                </div>
              </div>
              <div className="cand-card">
                <div className="cand-avatar">PN</div>
                <div className="cand-info">
                  <strong>Priya Nair</strong>
                  <span>Software Engineer</span>
                  <span className="cand-match text-green">87% Match</span>
                </div>
              </div>
              <div className="cand-card">
                <div className="cand-avatar">RV</div>
                <div className="cand-info">
                  <strong>Rahul Verma</strong>
                  <span>Mid-level Developer</span>
                  <span className="cand-match text-green">78% Match</span>
                </div>
              </div>
              <div className="cand-card">
                <div className="cand-avatar">SI</div>
                <div className="cand-info">
                  <strong>Sneha Iyer</strong>
                  <span>Software Engineer</span>
                  <span className="cand-match text-yellow">68% Match</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-bottom-icons">
            <div className="b-icon-col">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
              <span>AI-Powered<br />Matching</span>
            </div>
            <div className="b-icon-col">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              <span>Data-Driven<br />Insights</span>
            </div>
            <div className="b-icon-col">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span>Secure &<br />Private</span>
            </div>
            <div className="b-icon-col">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              <span>Faster Team<br />Building</span>
            </div>
          </div>
        </div>
      </div>

      {/* right panel — the form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          {/* add Skillmatch text logo to right panel */}
          <div className="form-brand-header">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <h2>Skill<strong>Match</strong></h2>
          </div>

          <h2 className="login-heading">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="login-subheading">
            {isRegister
              ? "Register as a manager to start matching engineers"
              : "Sign in to your account to continue"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon"><rect x="3" y="5" width="18" height="14" rx="2" ry="2" /><polyline points="3 7 12 13 21 7" /></svg>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="pw-header">
                <label htmlFor="login-password">Password</label>
                {!isRegister && <span className="forgot-pw">Forgot password?</span>}
              </div>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon-right"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              </div>
            </div>

            {!isRegister && (
              <div className="remember-me">
                <input type="checkbox" id="remember" defaultChecked />
                <label htmlFor="remember">Remember me</label>
              </div>
            )}

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-submit">
              {isRegister ? "Sign Up" : "Sign In"}
            </button>

            <div className="divider">
              <span>or continue with</span>
            </div>
          </form>

          <p className="login-switch">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
              {isRegister ? "Sign In" : "Sign up"}
            </span>
          </p>

          <div className="login-footer-links">
            <p>© 2025 SkillMatch. All rights reserved.</p>
            <div className="footer-links-row">
              <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
