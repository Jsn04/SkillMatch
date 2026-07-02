import { useEffect, useState } from "react";
import { getMeta, getRecommendations } from "./api";
import "./styles.css";

// the verticals I let the user filter by
const VERTICALS = ["FinTech", "Healthcare", "E-commerce", "SaaS", "Gaming"];

function App() {
  const [attributes, setAttributes] = useState([]);
  const [values, setValues] = useState({});
  const [method, setMethod] = useState("euclidean");
  const [vertical, setVertical] = useState("");
  const [minYears, setMinYears] = useState(0);
  const [maxYears, setMaxYears] = useState(30);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // when the page loads, get the attributes from the backend and start each one at 50
  useEffect(() => {
    getMeta().then((meta) => {
      setAttributes(meta.attributes);
      const start = {};
      meta.attributes.forEach((a) => {
        start[a] = 50;
      });
      setValues(start);
    });
  }, []);

  // update one slider's value
  function handleChange(attribute, newValue) {
    setValues({ ...values, [attribute]: Number(newValue) });
  }

  // send the project needs and filters to the backend and show the matches
  async function handleSubmit() {
    setLoading(true);
    const filters = { vertical: vertical, min_years: minYears, max_years: maxYears };
    const matches = await getRecommendations(values, method, filters);
    setResults(matches);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="header">
        <h1>TalentMatch</h1>
        <p className="subtitle">Set what the project needs and find the engineers who fit best.</p>
      </div>

      {/* the form is inside a card */}
      <div className="card form-card">
        {attributes.map((attribute) => (
          <div className="attribute" key={attribute}>
            <label>
              <span>{attribute}</span>
              <span className="value">{values[attribute]}</span>
            </label>
            <input
              type="range"
              min="0"
              max="99"
              value={values[attribute] || 0}
              onChange={(e) => handleChange(attribute, e.target.value)}
            />
          </div>
        ))}

        {/* filters */}
        <div className="filters">
          <label>
            Vertical:
            <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
              <option value="">Any</option>
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Min years:
            <input type="number" value={minYears} onChange={(e) => setMinYears(Number(e.target.value))} />
          </label>
          <label>
            Max years:
            <input type="number" value={maxYears} onChange={(e) => setMaxYears(Number(e.target.value))} />
          </label>
        </div>

        {/* choose how to match, and search */}
        <div className="controls">
          <label>Match by:</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="euclidean">Exact fit</option>
            <option value="cosine">Potential fit</option>
          </select>
          <button onClick={handleSubmit}>Find engineers</button>
        </div>
      </div>

      {loading && <p>Finding engineers...</p>}

      {/* message when the filters return nothing */}
      {searched && !loading && results.length === 0 && (
        <p>No engineers found for these filters.</p>
      )}

      {results.length > 0 && (
        <div className="results">
          <h2>Best matches</h2>
          {results.map((engineer, index) => (
            <div className="player-card" key={index}>
              <div className="rank">{index + 1}</div>
              <div className="player-main">
                <div className="name">{engineer.name}</div>
                <div className="info">
                  {engineer.role} · {engineer.region} · {engineer.vertical} · {engineer.years_experience}y exp
                </div>
                <div className="stats">
                  SEN {engineer.seniority} · DOM {engineer.domain} · COM {engineer.communication} · TZ{" "}
                  {engineer.timezone} · STK {engineer.stack} · BW {engineer.bandwidth}
                </div>
              </div>
              <div className="match">
                <div className="percent">{engineer.match_percent}%</div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${engineer.match_percent}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
