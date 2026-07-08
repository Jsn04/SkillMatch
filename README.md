# SkillMatch

SkillMatch is a web app that helps staff engineers onto projects. You set what the project needs,
like tech stack, seniority, domain, communication, timezone overlap, and availability, and it
shows the engineers who fit best, each with a match percentage.

## Why I made this

Staffing engineers onto client projects is a real headache in software and consulting companies.
A coordinator has to look at everyone on the bench and work out who fits a project's needs. I
wanted to turn that into a quick search: describe the project, get back a ranked list of the
engineers who fit.

A few things I like about it:
- two match modes: an exact fit (fill the seat now) and a potential fit (someone who could stretch into the role)
- you can filter the bench by vertical and years of experience
- it ranks the whole bench, not just a handful
- managers log in first, and once they find a good engineer they can assign them to a project and keep a record of it

## How it works

There are three parts, each in its own Docker container:
- frontend: a React page with the form and the results
- backend: a Python (FastAPI) API that does the matching
- database: PostgreSQL, which stores the engineers

The frontend never talks to the database directly. It calls the backend API, and the backend
reads from the database. The three containers are connected over a custom Docker network.

For the matching I use k-nearest-neighbours from scikit-learn. Each engineer is a point made of
their five levels (seniority, domain, communication, timezone, bandwidth). When you send the
project's needs, the backend first filters the bench (by discipline, vertical and years of
experience) and then finds the engineers nearest to what the project asked for. "Nearest" is
measured in one of two ways:
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
docker compose exec db psql -U skillmatch -d skillmatch -c "SELECT COUNT(*) FROM engineers;"
```

## Logging in

The app is meant for the project managers who staff the projects, so it asks you to log in
first. There is a default manager account so it can be tried straight away:

- email: manager@skillmatch.com
- password: password123

Because this is only a demo account, I show these same details as a hint inside the email and
password boxes on the login screen, so anyone trying the app knows what to type. A real app
would obviously not do this. You can also make your own account from the login screen
("Create one"). When you log in the
backend gives back a token, the frontend saves it, and it is sent with the searches so only a
logged in manager can use the matcher. Logout forgets the token.

The passwords are never stored as plain text. Each one is hashed with a salt (pbkdf2 from
Python's hashlib) before it goes in the database.

## How to use it

1. Log in (see above).
2. Type the name of the project you are staffing.
3. Pick the team you need (discipline), for example Backend or AI / ML.
4. Pick the level the project needs for each of the five things (for example seniority: Junior,
   Mid-level, Senior, or Principal / Architect).
5. Optionally filter by vertical and years of experience.
6. Choose "Exact fit" or "Potential fit".
7. Click "Find engineers".
8. You get the best matching engineers, each with a match percentage (higher means a better fit).

## Assigning engineers to projects

The matcher only shows who fits. The next step is actually putting someone on the project. Each
match has an "Assign" button that puts that engineer on the project name you typed, and it is
saved in the database with the manager who did it. Assigned engineers show up in a "Current
assignments" list at the bottom, where each one has a "Remove" button to take them off again.

Once an engineer is assigned they drop out of the best matches, since they are no longer free to
suggest. Removing them puts them back.

## The data (why it is generated)

The data in this project is generated, not real, and I want to be upfront about why. A company's
engineering bench (who works there, their seniority, availability, how client-facing they are) is
private internal HR data. Companies do not publish it, so there is no public dataset of engineers
like this anywhere online. Because the brief allows a generated database as long as the source is
declared, I generate a realistic synthetic bench of 3000 engineers instead.

The generation is in a notebook (data/data_generation.ipynb) using pandas, numpy and the Faker
library for the names. I do not pick every number at random, I shape the data so it behaves like
real engineers, using these correlations:

- more senior engineers have more years of experience
- more years of experience usually means deeper domain knowledge
- senior engineers tend to be more client-facing
- timezone overlap depends on the region (measured against a US head office: Americas high,
  EMEA medium, APAC low)
- very senior people are often spread across projects, so they have a bit less free bandwidth
- the team (discipline) is spread realistically, with backend and frontend the most common

This makes the matches sensible and explainable. For example, a project that needs full timezone
overlap tends to return engineers based in the Americas, which is exactly what you would expect.

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
