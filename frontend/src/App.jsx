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

function App() {
  const [attributes, setAttributes] = useState([]);
  const [values, setValues] = useState({});
  const [method, setMethod] = useState("euclidean");
  const [discipline, setDiscipline] = useState("");
  const [vertical, setVertical] = useState("");
  const [minYears, setMinYears] = useState(0);
  const [maxYears, setMaxYears] = useState(30);
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
    const filters = {
      discipline: discipline,
      vertical: vertical,
      min_years: minYears,
      max_years: maxYears,
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
        {/* the team is the first thing to pick */}
        <div className="attribute full">
          <label>Discipline (team needed)</label>
          <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="">Any team</option>
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

        {/* filters */}
        <div className="filters">
          <div>
            <label>Vertical</label>
            <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
              <option value="">Any</option>
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Min years of experience</label>
            <input type="number" value={minYears} onChange={(e) => setMinYears(Number(e.target.value))} />
          </div>
          <div>
            <label>Max years of experience</label>
            <input type="number" value={maxYears} onChange={(e) => setMaxYears(Number(e.target.value))} />
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
        <p>No engineers found for these filters.</p>
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
