"""
SkillMatch backend.

This is the API for the project. When it starts it loads the engineer data into the
database, and it gives the frontend a few endpoints: a health check, a list of engineers,
some info about the attributes (which the form uses), and the recommend endpoint that
returns the engineers who best match what a project needs.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from seed_data import seed
from database import get_connection
from recommender import recommend
from auth import create_users_table, seed_default_manager, register, login, current_user
from assignments import (
    create_assignments_table,
    add_assignment,
    get_assignments,
    remove_assignment,
)

app = FastAPI()

# The frontend runs on a different port, so the browser blocks the request
# unless I allow it here. For this project I allow all origins to keep it simple.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    # when the backend starts, make sure the engineer data is loaded into the database
    seed()
    # also make the users table and add the default manager login
    create_users_table()
    seed_default_manager()
    # and the table that stores which engineer is assigned to which project
    create_assignments_table()


@app.get("/health")
def health():
    return {"status": "ok"}


# what the frontend sends when someone registers or logs in
class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/register")
def register_user(request: LoginRequest):
    """Make a new manager account and log them straight in."""
    token = register(request.email, request.password)
    return {"token": token, "email": request.email.strip().lower()}


@app.post("/login")
def login_user(request: LoginRequest):
    """Check the email and password and hand back a login token."""
    token = login(request.email, request.password)
    return {"token": token, "email": request.email.strip().lower()}


@app.get("/engineers")
def get_engineers(limit: int = 20, user=Depends(current_user)):
    """Return some engineers from the database (20 by default)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, discipline, region, vertical, years_experience, "
        "seniority, domain, communication, timezone, bandwidth, "
        "availability_status, available_in_weeks "
        "FROM engineers LIMIT %s",
        (limit,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # turn each database row into a dictionary so it comes out as nice json
    engineers = []
    for row in rows:
        engineers.append({
            "id": row[0],
            "name": row[1],
            "discipline": row[2],
            "region": row[3],
            "vertical": row[4],
            "years_experience": row[5],
            "seniority": row[6],
            "domain": row[7],
            "communication": row[8],
            "timezone": row[9],
            "bandwidth": row[10],
            "availability_status": row[11],
            "available_in_weeks": row[12],
        })
    return engineers


# each level is picked from a few labelled options. the label is what the user sees,
# the value is the number the matching uses behind the scenes.
ATTRIBUTE_META = [
    {"key": "seniority", "label": "Experience Level", "options": [
        {"label": "Junior", "value": 15},
        {"label": "Mid-level", "value": 45},
        {"label": "Senior", "value": 70},
        {"label": "Principal / Architect", "value": 95},
    ]},
    {"key": "domain", "label": "Domain Expertise", "options": [
        {"label": "Generalist", "value": 15},
        {"label": "Some exposure", "value": 45},
        {"label": "Experienced", "value": 70},
        {"label": "Deep specialist", "value": 95},
    ]},
    {"key": "communication", "label": "Communication Skill", "options": [
        {"label": "Basic", "value": 15},
        {"label": "Good", "value": 45},
        {"label": "Strong", "value": 70},
        {"label": "Excellent", "value": 95},
    ]},
    {"key": "timezone", "label": "Timezone", "options": [
        {"label": "Flexible", "value": 15},
        {"label": "Some overlap", "value": 50},
        {"label": "Full overlap", "value": 90},
    ]},
    {"key": "bandwidth", "label": "Availability", "options": [
        {"label": "Advisory (light)", "value": 15},
        {"label": "Part-time", "value": 45},
        {"label": "Most of the week", "value": 70},
        {"label": "Full-time", "value": 95},
    ]},
]


@app.get("/meta")
def get_meta():
    """Return the attributes and their options. The form builds its dropdowns from this."""
    return {"attributes": ATTRIBUTE_META}


# the shape of the data the frontend sends when asking for matches
class MatchRequest(BaseModel):
    seniority: int
    domain: int
    communication: int
    timezone: int
    bandwidth: int
    method: str = "euclidean"
    top_n: int = 10
    # optional filters
    discipline: str | None = None
    vertical: str | None = None


@app.post("/recommend")
def recommend_engineers(request: MatchRequest, user=Depends(current_user)):
    """Take the levels a project needs (and any filters) and return the best matching engineers."""
    project = {
        "seniority": request.seniority,
        "domain": request.domain,
        "communication": request.communication,
        "timezone": request.timezone,
        "bandwidth": request.bandwidth,
    }
    return recommend(
        project,
        method=request.method,
        top_n=request.top_n,
        discipline=request.discipline,
        vertical=request.vertical,
    )


# what the frontend sends when a manager assigns an engineer to a project
class AssignRequest(BaseModel):
    engineer_id: int
    engineer_name: str
    project_name: str


@app.post("/assign")
def assign_engineer(request: AssignRequest, user=Depends(current_user)):
    """Put an engineer on a project. Saves who did it using the logged in manager's email."""
    return add_assignment(
        request.engineer_id,
        request.engineer_name,
        request.project_name,
        user["email"],
    )


@app.get("/assignments")
def list_assignments(user=Depends(current_user)):
    """Return all the current assignments so the frontend can show them."""
    return get_assignments()


@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, user=Depends(current_user)):
    """Take an engineer off a project by deleting that assignment."""
    remove_assignment(assignment_id)
    return {"status": "removed"}
