// I keep all the calls to the backend in this one file so the API
// address is only written in one place. If it changes I fix it here.

const API_URL = "http://localhost:8000";

// the login token is saved in the browser so it stays after a refresh.
// this helper reads it and builds the header the backend expects on protected calls.
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// asks the backend if it is alive
export async function checkHealth() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

// make a new manager account. returns the token + email on success.
export async function register(email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Could not register.");
  return data;
}

// log an existing manager in. returns the token + email on success.
export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Could not log in.");
  return data;
}

// gets the list of attributes (used to build the form)
export async function getMeta() {
  const res = await fetch(`${API_URL}/meta`);
  return res.json();
}

// sends the project's needed levels plus the filters and gets back the matching engineers.
// this one is protected, so it also sends the login token.
export async function getRecommendations(values, method, filters) {
  const res = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ ...values, method: method, top_n: 5, ...filters }),
  });
  return res.json();
}

// puts an engineer on a project (saved in the database)
export async function assignEngineer(engineerId, engineerName, projectName) {
  const res = await fetch(`${API_URL}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      engineer_id: engineerId,
      engineer_name: engineerName,
      project_name: projectName,
    }),
  });
  return res.json();
}

// gets the list of engineers that are already assigned to projects
export async function getAssignments() {
  const res = await fetch(`${API_URL}/assignments`, {
    headers: { ...authHeader() },
  });
  return res.json();
}

// removes one assignment (takes an engineer off a project)
export async function removeAssignment(assignmentId) {
  const res = await fetch(`${API_URL}/assignments/${assignmentId}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  return res.json();
}
