# Project Documentation

This file covers the technical side of how SkillMatch is built: the architecture, the
data, the matching logic, and the login/assign features. For how to install and run it
see INSTALLATION.md, and for how to use the app once it's running see USER_MANUAL.md.
The README has the shorter overview and the reasoning behind the project.

## Architecture

SkillMatch is three separate Docker containers, connected over a custom Docker network
(`skillmatch-net`), talking only through defined interfaces:

- **frontend** - a React app (built with Vite) that renders the form and the results.
  It never talks to the database directly.
- **backend** - a Python FastAPI service that exposes the API (login, matching, assign)
  and does all the actual work.
- **database** - PostgreSQL, holding the engineers, the manager accounts, and the
  assignments.

The frontend calls the backend over HTTP, and the backend is the only thing that talks
to the database. This keeps the three concerns (display, logic, storage) separate, and
means the frontend could be swapped out or a mobile app added later without touching the
backend at all.

## The data

SkillMatch needs a bench of engineers to match against, but a real company's staffing
bench is private HR data (who works there, their seniority, availability, and so on), so
there is no public dataset of this like there is for, say, football players. Instead a
synthetic bench of 3000 engineers is generated in `data/data_generation.ipynb` using
pandas, numpy, and Faker for the names.

The values are not fully random. A handful of correlations are built in so the data
behaves like a real engineering bench would:

- seniority is a bell curve, and years of experience follows from it
- more years usually means deeper domain knowledge
- more senior engineers tend to be more client-facing (higher communication score)
- timezone overlap is scored against a US head office, so it depends on the engineer's
  region (Americas highest, EMEA medium, APAC lowest)
- very senior engineers are often spread across more projects, so they have a little
  less free bandwidth
- current availability (available / partially committed / fully booked) is rolled
  separately, nudged up slightly for senior engineers who tend to get pulled onto more
  projects
- names are 70% Indian and 30% international, picked independently of region or vertical

## The matching logic

The matching is worked out first in a notebook, `data/similarity.ipynb`, before being
copied into the backend (`backend/recommender.py`), so the logic could be tested and
read step by step before it became part of the API.

Each engineer is treated as a point made of five values: seniority, domain,
communication, timezone, and bandwidth. A project's needs are the same five values. The
backend uses scikit-learn's `NearestNeighbors` to find the engineers whose point is
closest to the project's point, in one of two ways:

- **Euclidean distance** ("Exact fit") - looks for engineers whose levels are close to
  exactly what was asked for. Engineers who are already fully booked elsewhere are
  excluded automatically, since this mode is meant for staffing a seat right now.
- **Cosine distance** ("Potential fit") - looks at the shape/balance of an engineer's
  skills rather than their exact levels, so it can surface someone whose profile points
  the same direction even if their numbers are a bit lower. Busy engineers are still
  included here, since this mode is for scouting ahead rather than staffing immediately.

The distance is converted into a 0-100 match percentage so it is easy to read. Before
matching, the bench is also filtered by discipline (tech stack) and vertical (industry)
if the manager picked either.

## Manager logins

Passwords are never stored in plain text. Each one is hashed with a random salt using
`pbkdf2_hmac` from Python's `hashlib` (in `backend/auth.py`), and only the hash and salt
are saved. Logging in checks the entered password against the stored hash the same way.

On a successful login or registration, the backend returns a signed JWT token
(`PyJWT`) holding the user's id and an expiry time. The frontend stores this token and
sends it with every matching/assign request. Endpoints that should only be used by a
logged-in manager (`/recommend`, `/engineers`, `/assign`, `/assignments`) check this
token before doing anything, and reject the request with a 401 if it is missing, wrong,
or expired.

## Assigning engineers to projects

`backend/assignments.py` adds a simple `assignments` table (engineer, project name,
which manager assigned them, and when). Once an engineer is assigned, they are excluded
from future "best matches" results for the same reason a fully booked engineer is
excluded under "Exact fit": they are no longer a free option. Removing an assignment
makes them available again.

## Tools used

- Python and FastAPI for the backend and API
- scikit-learn for the k-nearest-neighbours matching
- PostgreSQL for the database
- React (with Vite) for the frontend
- pandas, numpy, and Faker for generating the data
- PyJWT for the login tokens
- Docker and docker compose to run everything together

## Project structure

```
SkillMatch/
  docker-compose.yml        starts the three containers on a custom network
  backend/
    main.py                 the API (health, login, engineers, meta, recommend, assign)
    recommender.py          the matching logic (k-NN)
    auth.py                 manager logins (users table, password hashing, login token)
    assignments.py          saving which engineer is on which project
    database.py             connects to the database
    seed_data.py            loads engineers.csv into the database on startup
    Dockerfile
    requirements.txt
  frontend/
    src/
      App.jsx               the form and the results
      Login.jsx             the login / register screen
      api.js                the calls to the backend
      styles.css
    index.html
    Dockerfile
    package.json
  data/
    engineers.csv           the generated engineer data
    data_generation.ipynb   how I generated the data
    similarity.ipynb        how I built the matching
```
