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
    <div className="page">
      <div className="header">
        <h1>SkillMatch</h1>
        <p className="subtitle">Manager sign in</p>
      </div>

      <div className="card login-card">
        <form onSubmit={handleSubmit}>
          <div className="attribute full">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="attribute full">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button">
            {isRegister ? "Create account" : "Login"}
          </button>
        </form>

        {/* small link to flip between login and register */}
        <p className="login-switch">
          {isRegister ? "Already have an account?" : "New manager?"}{" "}
          <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Login" : "Create one"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
