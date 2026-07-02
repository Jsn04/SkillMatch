import { useEffect, useState } from "react";
import { getMeta, getRecommendations } from "./api";
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
  const [attributes, setAttributes] = useState([]);
  const [values, setValues] = useState({});
  const [method, setMethod] = useState("euclidean");
  const [discipline, setDiscipline] = useState("");
  const [vertical, setVertical] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="page">
      <div className="header">
        <h1>SkillMatch</h1>
        <p className="subtitle">Describe the project and get the engineers who fit best.</p>
      </div>

      <div className="card">
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

      {searched && !loading && results.length > 0 && results.length < 3 && (
        <p className="hint">Only {results.length} engineer{results.length > 1 ? "s" : ""} match these filters. Widen a filter for more options.</p>
      )}

      {results.length > 0 && (
        <div className="results">
          <h2>Best matches</h2>
          {results.map((engineer, index) => {
            const status = statusBadge(engineer);
            return (
              <div className="result-row" key={index}>
                <div className="rank">{index + 1}</div>
                <div className="result-main">
                  <div className="name">{engineer.name}</div>
                  <div className="info">
                    {engineer.discipline} · {engineer.region} · {engineer.vertical} · {engineer.years_experience}y exp
                  </div>
                  <span className={`status-badge ${status.cls}`}>{status.text}</span>
                </div>
                <div className="match-pill">{engineer.match_percent}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
