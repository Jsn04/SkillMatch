import { useEffect, useState } from "react";
import {
  getMeta,
  getRecommendations,
  assignEngineer,
  getAssignments,
  removeAssignment,
  getEngineers,
} from "./api";
import Login from "./Login";
import "./styles.css";

// the teams the user can ask for
const DISCIPLINES = ["Frontend", "Backend", "Data / Database", "DevOps", "Cloud", "Networking", "AI / ML", "Other"];

// the industries the user can filter by
const VERTICALS = [
  "FinTech", "Healthcare", "E-commerce", "SaaS", "Gaming",
  "Media", "Logistics", "EdTech", "Telecom", "Government", "Other",
];

// take the first letter of the first two names for the little avatar circle
function initials(name) {
  const parts = name.trim().split(/[\s@]/);
  const first = parts[0] ? parts[0][0] : "";
  const second = parts[1] ? parts[1][0] : "";
  return (first + second).toUpperCase();
}

// turns an engineer's availability into a small badge (text + colour class)
function statusBadge(engineer) {
  if (engineer.availability_status === "Available") {
    return { text: "Available now", cls: "status-available" };
  }
  if (engineer.availability_status === "Partially committed") {
    return { text: `Partial · ${engineer.available_in_weeks}w`, cls: "status-partial" };
  }
  return { text: `Booked · ${engineer.available_in_weeks}w`, cls: "status-booked" };
}

// classify the match quality for colour coding
function matchQuality(percent) {
  if (percent >= 90) return { label: "Excellent Match", cls: "quality-excellent" };
  if (percent >= 75) return { label: "Great Match", cls: "quality-great" };
  if (percent >= 60) return { label: "Good Match", cls: "quality-good" };
  return { label: "Fair Match", cls: "quality-fair" };
}

// colour used for the circular donut chart around the match percentage
function matchColor(percent) {
  if (percent >= 90) return "#10b981";
  if (percent >= 75) return "#3b82f6";
  if (percent >= 60) return "#f59e0b";
  return "#ef4444";
}

function App() {
  // the login token decides what to show. if there is no token the manager sees the
  // login screen, once they log in the token is saved and the matcher shows instead.
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

  // which page the sidebar is showing
  const [activePage, setActivePage] = useState("dashboard");

  const [attributes, setAttributes] = useState([]);
  const [values, setValues] = useState({});
  const [method, setMethod] = useState("euclidean");
  const [discipline, setDiscipline] = useState("");
  const [vertical, setVertical] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // the project the manager is staffing, and the engineers already assigned to projects
  const [projectName, setProjectName] = useState("");
  const [assignments, setAssignments] = useState([]);

  // engineers page state
  const [engineers, setEngineers] = useState([]);
  const [engineersLoading, setEngineersLoading] = useState(false);

  // called by the login screen when login works. save the token so it stays after a refresh.
  function handleLogin(newToken, userEmail) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("email", userEmail);
    setToken(newToken);
    setEmail(userEmail);
  }

  // logout just forgets the token, which sends the manager back to the login screen
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken("");
    setEmail("");
  }

  // when the page loads, get the attributes and their options from the backend
  useEffect(() => {
    getMeta().then((meta) => {
      setAttributes(meta.attributes);
      const start = {};
      meta.attributes.forEach((attr) => {
        start[attr.key] = attr.options[1].value; // start on the second option
      });
      setValues(start);
    });
  }, []);

  // once the manager is logged in, load the assignments that already exist
  useEffect(() => {
    if (token) {
      getAssignments().then((data) => setAssignments(data));
    }
  }, [token]);

  // load engineers when switching to the engineers page
  useEffect(() => {
    if (activePage === "engineers" && token && engineers.length === 0) {
      setEngineersLoading(true);
      getEngineers(50).then((data) => {
        setEngineers(data);
        setEngineersLoading(false);
      });
    }
  }, [activePage, token]);

  function handleChange(key, newValue) {
    setValues({ ...values, [key]: Number(newValue) });
  }

  async function handleSubmit() {
    setLoading(true);
    const filters = {
      discipline: discipline,
      vertical: vertical,
    };
    const matches = await getRecommendations(values, method, filters);
    setResults(matches);
    setSearched(true);
    setLoading(false);
  }

  // put an engineer on the project the manager typed in, then refresh the list below
  async function handleAssign(engineer) {
    if (!projectName.trim()) {
      alert("Type a project name first, then assign an engineer to it.");
      return;
    }
    await assignEngineer(engineer.id, engineer.name, projectName.trim());
    const data = await getAssignments();
    setAssignments(data);
  }

  // take an engineer off a project, then refresh the list
  async function handleRemoveAssignment(assignmentId) {
    await removeAssignment(assignmentId);
    const data = await getAssignments();
    setAssignments(data);
  }

  // no token means the manager is not logged in yet, so show the login screen instead
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // engineers who are already assigned to a project should not still show up as a match,
  // so I collect their ids and leave them out of the results below
  const assignedIds = new Set(assignments.map((a) => a.engineer_id));
  const visibleResults = results.filter((engineer) => !assignedIds.has(engineer.id));

  return (
    <div className="app-layout">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-logo-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-item ${activePage === "projects" ? "active" : ""}`}
            onClick={() => setActivePage("projects")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <span>Projects</span>
          </button>
          <button
            className={`sidebar-item ${activePage === "engineers" ? "active" : ""}`}
            onClick={() => setActivePage("engineers")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>Engineers</span>
          </button>
        </nav>
      </aside>

      {/* ─── Main area ─── */}
      <div className="main-area">
        {/* ─── Top header ─── */}
        <header className="top-header">
          <div className="header-brand">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4263eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="brand-text">Skill<strong>Match</strong></span>
          </div>
          <div className="header-right">
            <div className="header-user">
              <div className="user-avatar">{initials(email)}</div>
              <div className="user-meta">
                <span className="user-name">{email}</span>
                <span className="user-role">Engineering Manager</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* ─── Page content ─── */}
        <main className="content">

          {/* ═══════════ DASHBOARD PAGE ═══════════ */}
          {activePage === "dashboard" && (
            <>
              {/* hero section */}
              <div className="hero">
                <h1 className="hero-title">Right Engineers. Right Projects.</h1>
                <p className="hero-subtitle">
                  ML-powered matching to build high-performing teams from a bench of 3,000.
                </p>
              </div>

              {/* how-it-works step bar */}
              <div className="steps-bar">
                <div className="step">
                  <div className="step-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <span className="step-num">1.</span> Define Project Requirements
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div>
                    <span className="step-num">2.</span> Match Engine Evaluates
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div>
                    <span className="step-num">3.</span> Get Best Matching Engineers
                  </div>
                </div>
              </div>

              {/* ─── two-panel layout: form + results ─── */}
              <div className="dashboard-panels">
                {/* left panel — the form */}
                <div className="panel panel-form">
                  <h2 className="panel-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Project Requirements
                  </h2>

                  {/* project section */}
                  <div className="form-section">
                    <div className="section-label">PROJECT</div>
                    <div className="field">
                      <label>Project name</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Payments revamp"
                      />
                    </div>
                  </div>

                  {/* what the project needs */}
                  <div className="form-section">
                    <div className="section-label">WHAT THE PROJECT NEEDS</div>
                    <div className="field">
                      <label>Tech Stack</label>
                      <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                        <option value="">Any tech stack</option>
                        {DISCIPLINES.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="fields-grid">
                      {attributes.map((attr) => (
                        <div className="field" key={attr.key}>
                          <label>{attr.label}</label>
                          <select value={values[attr.key]} onChange={(e) => handleChange(attr.key, e.target.value)}>
                            {attr.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* filters */}
                  <div className="form-section">
                    <div className="section-label">FILTERS</div>
                    <div className="field">
                      <label>Industry</label>
                      <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
                        <option value="">Any industry</option>
                        {VERTICALS.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* match mode + search button */}
                  <div className="form-actions">
                    <div className="match-mode">
                      <label>Match by</label>
                      <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option value="euclidean">Exact fit</option>
                        <option value="cosine">Potential fit</option>
                      </select>
                    </div>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      {loading ? "Searching..." : "Find Best Matches"}
                    </button>
                  </div>
                  <p className="method-note">
                    {method === "euclidean"
                      ? "Exact fit only shows engineers who are not fully booked elsewhere."
                      : "Potential fit shows everyone, including busy engineers, so you can plan ahead."}
                  </p>
                </div>

                {/* right panel — results */}
                <div className="panel panel-results">
                  <div className="panel-results-header">
                    <h2 className="panel-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Top Matched Engineers
                    </h2>
                    {visibleResults.length > 0 && (
                      <span className="results-count">{visibleResults.length} found</span>
                    )}
                  </div>
                  {!searched && !loading && (
                    <p className="results-subtitle">Ranked by match percentage</p>
                  )}

                  {loading && (
                    <div className="results-empty">
                      <div className="spinner" />
                      <p>Searching across the bench...</p>
                    </div>
                  )}

                  {!searched && !loading && (
                    <div className="results-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p>Define project requirements and click<br />"Find Best Matches" to see results</p>
                    </div>
                  )}

                  {searched && !loading && results.length === 0 && (
                    <div className="results-empty">
                      <p>No engineers found for these filters.<br />Try widening the tech stack or industry.</p>
                    </div>
                  )}

                  {searched && !loading && visibleResults.length > 0 && visibleResults.length < 3 && (
                    <p className="results-hint">Only {visibleResults.length} engineer{visibleResults.length > 1 ? "s" : ""} match — widen a filter for more.</p>
                  )}

                  {/* result cards */}
                  <div className="results-list">
                    {visibleResults.map((engineer, index) => {
                      const status = statusBadge(engineer);
                      const quality = matchQuality(engineer.match_percent);
                      const color = matchColor(engineer.match_percent);
                      return (
                        <div className="match-card" key={engineer.id}>
                          <div className="match-card-left">
                            <div className="match-avatar">{initials(engineer.name)}</div>
                            <span className={`match-dot ${status.cls}`} />
                          </div>
                          <div className="match-card-info">
                            <div className="match-name">{engineer.name}</div>
                            <div className="match-meta">
                              {engineer.discipline} · {engineer.region} · {engineer.years_experience}y exp
                            </div>
                            <span className={`match-status ${status.cls}`}>{status.text}</span>
                          </div>
                          <div className="match-card-score">
                            <div
                              className="match-circle"
                              style={{
                                background: `conic-gradient(${color} ${engineer.match_percent * 3.6}deg, #eef0f5 0)`
                              }}
                            >
                              <span>{engineer.match_percent}%</span>
                            </div>
                          </div>
                          <div className="match-card-quality">
                            <span className={`quality-label ${quality.cls}`}>{quality.label}</span>
                            <span className="quality-detail">{engineer.vertical}</span>
                          </div>
                          <button className="btn-assign" onClick={() => handleAssign(engineer)}>
                            Assign
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════ PROJECTS PAGE ═══════════ */}
          {activePage === "projects" && (
            <div className="page-section">
              <div className="page-header">
                <h1 className="page-title">Project Assignments</h1>
                <p className="page-desc">Engineers currently assigned to projects. Assign from the Dashboard, manage here.</p>
              </div>

              {assignments.length === 0 ? (
                <div className="empty-state">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                  <h3>No assignments yet</h3>
                  <p>Go to the Dashboard, search for engineers, and assign them to a project.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Engineer</th>
                        <th>Project</th>
                        <th>Assigned By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a, i) => (
                        <tr key={a.id}>
                          <td className="cell-num">{i + 1}</td>
                          <td>
                            <div className="cell-with-avatar">
                              <div className="table-avatar">{initials(a.engineer_name)}</div>
                              <span className="cell-name">{a.engineer_name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="project-badge">{a.project_name}</span>
                          </td>
                          <td className="cell-secondary">{a.manager_email || "—"}</td>
                          <td>
                            <button className="btn-remove" onClick={() => handleRemoveAssignment(a.id)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ ENGINEERS PAGE ═══════════ */}
          {activePage === "engineers" && (
            <div className="page-section">
              <div className="page-header">
                <h1 className="page-title">Engineer Database</h1>
                <p className="page-desc">Showing {engineers.length} engineers from the bench. These are the candidates the matching engine searches across.</p>
              </div>

              {engineersLoading ? (
                <div className="empty-state">
                  <div className="spinner" />
                  <p>Loading engineers...</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="data-table engineers-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Discipline</th>
                        <th>Region</th>
                        <th>Industry</th>
                        <th>Yrs Exp</th>
                        <th>Seniority</th>
                        <th>Domain</th>
                        <th>Comms</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engineers.map((eng, i) => {
                        const status = statusBadge(eng);
                        return (
                          <tr key={eng.id}>
                            <td className="cell-num">{i + 1}</td>
                            <td>
                              <div className="cell-with-avatar">
                                <div className="table-avatar">{initials(eng.name)}</div>
                                <span className="cell-name">{eng.name}</span>
                              </div>
                            </td>
                            <td><span className="discipline-badge">{eng.discipline}</span></td>
                            <td>{eng.region}</td>
                            <td>{eng.vertical}</td>
                            <td className="cell-num">{eng.years_experience}</td>
                            <td className="cell-num">{eng.seniority}</td>
                            <td className="cell-num">{eng.domain}</td>
                            <td className="cell-num">{eng.communication}</td>
                            <td><span className={`status-badge ${status.cls}`}>{status.text}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;
