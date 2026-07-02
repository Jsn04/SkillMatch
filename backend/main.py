"""
TalentMatch backend.

This is the API for the project. When it starts it loads the engineer data into the
database, and it gives the frontend a few endpoints: a health check, a list of engineers,
some info about the attributes (which the form uses), and the recommend endpoint that
returns the engineers who best match what a project needs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from seed_data import seed
from database import get_connection
from recommender import recommend

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


@app.get("/health")
def health():
    """Returns ok so I can check the backend is running."""
    return {"status": "ok"}


@app.get("/engineers")
def get_engineers(limit: int = 20):
    """Return some engineers from the database (20 by default)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, role, region, vertical, years_experience, "
        "seniority, domain, communication, timezone, stack, bandwidth "
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
            "role": row[2],
            "region": row[3],
            "vertical": row[4],
            "years_experience": row[5],
            "seniority": row[6],
            "domain": row[7],
            "communication": row[8],
            "timezone": row[9],
            "stack": row[10],
            "bandwidth": row[11],
        })
    return engineers


# each attribute is picked from a few labelled levels. the label is what the user sees,
# the value is the number the matching uses behind the scenes.
ATTRIBUTE_META = [
    {"key": "seniority", "label": "Seniority", "options": [
        {"label": "Junior", "value": 15},
        {"label": "Mid-level", "value": 45},
        {"label": "Senior", "value": 70},
        {"label": "Principal / Architect", "value": 95},
    ]},
    {"key": "domain", "label": "Domain familiarity", "options": [
        {"label": "Generalist", "value": 15},
        {"label": "Some exposure", "value": 45},
        {"label": "Experienced", "value": 70},
        {"label": "Deep specialist", "value": 95},
    ]},
    {"key": "communication", "label": "Client communication", "options": [
        {"label": "Heads-down", "value": 15},
        {"label": "Occasional", "value": 45},
        {"label": "Client-facing", "value": 70},
        {"label": "Executive-facing", "value": 95},
    ]},
    {"key": "timezone", "label": "Timezone overlap", "options": [
        {"label": "Async", "value": 15},
        {"label": "Partial overlap", "value": 45},
        {"label": "Mostly overlap", "value": 70},
        {"label": "Full sync", "value": 95},
    ]},
    {"key": "stack", "label": "Stack modernity", "options": [
        {"label": "Legacy", "value": 15},
        {"label": "Mixed", "value": 45},
        {"label": "Modern", "value": 70},
        {"label": "Greenfield / AI", "value": 95},
    ]},
    {"key": "bandwidth", "label": "Bandwidth", "options": [
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
    stack: int
    bandwidth: int
    method: str = "euclidean"
    top_n: int = 10
    # optional filters
    vertical: str | None = None
    min_years: int | None = None
    max_years: int | None = None


@app.post("/recommend")
def recommend_engineers(request: MatchRequest):
    """Take the levels a project needs (and any filters) and return the best matching engineers."""
    project = {
        "seniority": request.seniority,
        "domain": request.domain,
        "communication": request.communication,
        "timezone": request.timezone,
        "stack": request.stack,
        "bandwidth": request.bandwidth,
    }
    return recommend(
        project,
        method=request.method,
        top_n=request.top_n,
        vertical=request.vertical,
        min_years=request.min_years,
        max_years=request.max_years,
    )
