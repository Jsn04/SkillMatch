import { useEffect, useState } from "react";
import {
  getMeta,
  getRecommendations,
  assignEngineer,
  getAssignments,
  removeAssignment,
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

// turns an engineer's availability into a small badge (text + colour class)
function statusBadge(engineer) {
  if (engineer.availability_status === "Available") {
    return { text: "Available now", cls: "status-available" };
  }
  if (engineer.availability_status === "Partially committed") {
    return { text: `Partially free · full in ${engineer.available_in_weeks}w`, cls: "status-partial" };
  }
  return { text: `Fully booked · free in ${engineer.available_in_weeks}w`, cls: "status-booked" };
}

function App() {
  // the login token decides what to show. if there is no token the manager sees the
  // login screen, once they log in the token is saved and the matcher shows instead.
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

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

  function handleChange(key, newValue) {
    setValues({ ...values, [key]: Number(newValue) });
  }

  async function handleSubmit() {
    setLoading(true);
    // years of experience is not a separate filter, since seniority already implies it
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
    <div className="page">
      {/* small bar showing who is logged in, with a logout button */}
      <div className="topbar">
        <span className="topbar-user">Signed in as {email}</span>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="header">
        <h1>SkillMatch</h1>
        <p className="subtitle">Describe the project and get the engineers who fit best.</p>
      </div>

      <div className="card">
        {/* the name of the project being staffed. it is used when assigning an engineer */}
        <div className="attribute full">
          <label>Project name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Payments revamp"
          />
        </div>

        {/* the tech stack is the first thing to pick */}
        <div className="attribute full">
          <label>Tech Stack</label>
          <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="">Any tech stack</option>
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* the levels the project needs, as dropdowns in a grid */}
        <div className="grid">
          {attributes.map((attr) => (
            <div className="attribute" key={attr.key}>
              <label>{attr.label}</label>
              <select value={values[attr.key]} onChange={(e) => handleChange(attr.key, e.target.value)}>
                {attr.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* the industry filter, optional. years of experience is not a separate filter
            here, since the Experience Level dropdown above already implies it */}
        <div className="attribute full">
          <label>Industry</label>
          <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
            <option value="">Any industry</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* match type + search */}
        <div className="controls">
          <label>Match by</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="euclidean">Exact fit</option>
            <option value="cosine">Potential fit</option>
          </select>
          <button onClick={handleSubmit}>Find engineers</button>
        </div>
        <p className="method-note">
          {method === "euclidean"
            ? "Exact fit only shows engineers who are not fully booked elsewhere."
            : "Potential fit shows everyone, including busy engineers, so you can plan ahead."}
        </p>
      </div>

      {loading && <p>Finding engineers...</p>}

      {searched && !loading && results.length === 0 && (
        <p>No engineers found for these filters. Try widening the tech stack or industry.</p>
      )}

      {searched && !loading && visibleResults.length > 0 && visibleResults.length < 3 && (
        <p className="hint">Only {visibleResults.length} engineer{visibleResults.length > 1 ? "s" : ""} match these filters. Widen a filter for more options.</p>
      )}

      {visibleResults.length > 0 && (
        <div className="results">
          <h2>Best matches</h2>
          {visibleResults.map((engineer, index) => {
            const status = statusBadge(engineer);
            return (
              <div className="result-row" key={engineer.id}>
                <div className="rank">{index + 1}</div>
                <div className="result-main">
                  <div className="name">{engineer.name}</div>
                  <div className="info">
                    {engineer.discipline} · {engineer.region} · {engineer.vertical} · {engineer.years_experience}y exp
                  </div>
                  <span className={`status-badge ${status.cls}`}>{status.text}</span>
                </div>
                <div className="match-pill">{engineer.match_percent}%</div>
                {/* assign this engineer to the project typed above */}
                <button className="assign-button" onClick={() => handleAssign(engineer)}>
                  Assign
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* the engineers already put on projects, with a button to take them off again */}
      {assignments.length > 0 && (
        <div className="assignments">
          <h2>Current assignments</h2>
          {assignments.map((a) => (
            <div className="assignment-row" key={a.id}>
              <div className="assignment-main">
                <span className="assignment-engineer">{a.engineer_name}</span>
                <span className="assignment-arrow"> → </span>
                <span className="assignment-project">{a.project_name}</span>
              </div>
              <button className="remove-button" onClick={() => handleRemoveAssignment(a.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
