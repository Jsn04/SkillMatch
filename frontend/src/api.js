// I keep all the calls to the backend in this one file so the API
// address is only written in one place. If it changes I fix it here.

const API_URL = "http://localhost:8000";

// asks the backend if it is alive
export async function checkHealth() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

// gets the list of attributes (used to build the form)
export async function getMeta() {
  const res = await fetch(`${API_URL}/meta`);
  return res.json();
}

// sends the project's needed levels plus the filters and gets back the matching engineers
export async function getRecommendations(values, method, filters) {
  const res = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, method: method, top_n: 10, ...filters }),
  });
  return res.json();
}
