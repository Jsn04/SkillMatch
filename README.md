# TalentMatch

TalentMatch is a web app that helps staff engineers onto projects. You set the levels a project
needs (seniority, domain, communication, timezone, stack, bandwidth), pick how you want to match,
and it shows the engineers who fit best, each with a match percentage.

## Why I made this

Staffing engineers onto client projects is a real headache in software and consulting companies.
A coordinator has to look at everyone on the bench and work out who fits a project's needs. I
wanted to turn that into a quick search: describe the project, get back a ranked list of the
engineers who fit.

A few things I like about it:
- two match modes: an exact fit (fill the seat now) and a potential fit (someone who could stretch into the role)
- you can filter the bench by vertical and years of experience
- it ranks the whole bench, not just a handful

## How it works

There are three parts, each in its own Docker container:
- frontend: a React page with the form and the results
- backend: a Python (FastAPI) API that does the matching
- database: PostgreSQL, which stores the engineers

The frontend never talks to the database directly. It calls the backend API, and the backend
reads from the database. The three containers are connected over a custom Docker network.

For the matching I use k-nearest-neighbours from scikit-learn. Each engineer is a point made of
their six values. When you send the project's needs, the backend finds the engineers nearest to
that. "Nearest" is measured in one of two ways:
- Euclidean distance, which is the exact fit (their levels are close to what the project asked for)
- Cosine, which is the potential fit (their balance of skills points the same way, even if the levels are lower)

## How to run it

You need Docker installed. From the project folder run:

```
docker compose up
```

Then open:
- the app: http://localhost:5173
- the backend health check: http://localhost:8000/health

The database loads the engineer data by itself the first time the backend starts, so there is
nothing else to set up.

If you want to check the data is in the database:

```
docker compose exec db psql -U talentmatch -d talentmatch -c "SELECT COUNT(*) FROM engineers;"
```

## How to use it

1. Pick the level the project needs for each of the six things (for example seniority: Junior,
   Mid-level, Senior, or Principal / Architect).
2. Optionally filter by vertical and years of experience.
3. Choose "Exact fit" or "Potential fit".
4. Click "Find engineers".
5. You get the best matching engineers, each with a match percentage (higher means a better fit).

## The data

There is no public dataset of engineers rated on these six things (real staffing data is
confidential), so I generate a realistic synthetic bench of 2000 engineers. This is done in a
notebook (data/data_generation.ipynb) using pandas, numpy and the Faker library for the names. I
add a couple of sensible correlations, for example senior engineers tend to have more years of
experience and to be a bit more client-facing. The data is generated, not real, and that is
declared here.

## How I built the matching

I worked out the matching in a second notebook (data/similarity.ipynb) before putting it into the
backend, so I could test it on the data first. It shows the exact-fit (Euclidean) and
potential-fit (Cosine) matching, adding weights, and the final recommend function that the
backend uses.

## Tools I used

- Python and FastAPI for the backend and API
- scikit-learn for the k-nearest-neighbours matching
- PostgreSQL for the database
- React (with Vite) for the frontend
- pandas, numpy and Faker for generating the data
- Docker and docker compose to run everything together

## Project structure

```
TalentMatch/
  docker-compose.yml        starts the three containers on a custom network
  backend/
    main.py                 the API (health, engineers, meta, recommend)
    recommender.py          the matching logic (k-NN)
    database.py             connects to the database
    seed_data.py            loads engineers.csv into the database on startup
    Dockerfile
    requirements.txt
  frontend/
    src/
      App.jsx               the form and the results
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
