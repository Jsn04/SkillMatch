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

// experience is optional, so this starts on "Any" (no filter at all)
const EXPERIENCE_RANGES = [
  { value: "", label: "Any experience", min: null, max: null },
  { value: "0-3", label: "0 - 3 years (entry)", min: 0, max: 3 },
  { value: "3-7", label: "3 - 7 years (mid)", min: 3, max: 7 },
  { value: "7-15", label: "7 - 15 years (senior)", min: 7, max: 15 },
  { value: "15+", label: "15+ years (veteran)", min: 15, max: null },
];

function App() {
  const [attributes, setAttributes] = useState([]);
  const [values, setValues] = useState({});
  const [method, setMethod] = useState("euclidean");
  const [discipline, setDiscipline] = useState("");
  const [vertical, setVertical] = useState("");
  const [experience, setExperience] = useState("");
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
    // experience is optional, so only send a range if the user actually picked one
    const range = EXPERIENCE_RANGES.find((r) => r.value === experience);
    const filters = {
      discipline: discipline,
      vertical: vertical,
      min_years: range.min,
      max_years: range.max,
    };
    const matches = await getRecommendations(values, method, filters);
    setResults(matches);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="header">
        <h1>TalentMatch</h1>
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

        {/* filters, both optional */}
        <div className="filters">
          <div>
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
          <div>
            <label>Experience</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              {EXPERIENCE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
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
      </div>

      {loading && <p>Finding engineers...</p>}

      {searched && !loading && results.length === 0 && (
        <p>No engineers found for these filters. Try widening the tech stack, industry or experience filter.</p>
      )}

      {searched && !loading && results.length > 0 && results.length < 3 && (
        <p className="hint">Only {results.length} engineer{results.length > 1 ? "s" : ""} match these filters. Widen a filter for more options.</p>
      )}

      {results.length > 0 && (
        <div className="results">
          <h2>Best matches</h2>
          {results.map((engineer, index) => (
            <div className="result-row" key={index}>
              <div className="rank">{index + 1}</div>
              <div className="result-main">
                <div className="name">{engineer.name}</div>
                <div className="info">
                  {engineer.discipline} · {engineer.region} · {engineer.vertical} · {engineer.years_experience}y exp
                </div>
              </div>
              <div className="match-pill">{engineer.match_percent}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
