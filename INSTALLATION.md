# Installation Guide

This covers everything needed to get SkillMatch running from a fresh clone of the repo,
step by step. The README has the "why" behind the project, this file is just the "how to
run it" part in more detail.

## 1. What you need installed

- Docker Desktop (or Docker Engine + Docker Compose on Linux). That's it. You do not need
  Python, Node, or PostgreSQL installed on your machine, everything runs inside containers.
- Check Docker is installed and running:

```
docker --version
docker compose version
```

## 2. Get the project

Clone the repo and go into the project folder:

```
git clone https://github.com/Jsn04/SkillMatch.git
cd SkillMatch
```

## 3. Environment variables (optional)

The project runs out of the box without any setup, using default local values. If you
want to set your own database username/password, copy the example env file and edit it:

```
cp .env.example .env
```

Then open `.env` and change the values. If you skip this step entirely, the defaults in
`docker-compose.yml` are used instead, so this step is optional.

## 4. Start the project

From the project folder (where `docker-compose.yml` is), run:

```
docker compose up
```

The first time you run this it will also build the images, so it takes a bit longer (a
minute or two depending on your internet speed, since it downloads Python, Node and
Postgres base images). After that, starting is quick.

What happens automatically, with nothing else needed from you:
- the database container starts
- the backend waits until the database is actually ready (there is a healthcheck for this)
- the backend creates its tables and loads the 3000 generated engineers into the database
- a default manager login is created so you can try the app straight away
- the frontend starts and serves the React app

You will see logs from all three containers in the same terminal. Wait until you see the
frontend log line that looks like `Local: http://localhost:5173/` before opening the app.

## 5. Open the app

- The app itself: http://localhost:5173
- The backend health check (should show `{"status":"ok"}`): http://localhost:8000/health

Log in with the default manager account:
- email: `manager@skillmatch.com`
- password: `password123`

These same details are shown as a hint inside the email and password boxes on the login
screen, so you do not need to remember them separately.

## 6. Checking the data loaded correctly (optional)

If you want to confirm the database actually has the engineers in it:

```
docker compose exec db psql -U skillmatch -d skillmatch -c "SELECT COUNT(*) FROM engineers;"
```

This should return 3000.

## 7. Stopping the project

Press `Ctrl+C` in the terminal where `docker compose up` is running, or from another
terminal in the project folder run:

```
docker compose down
```

This stops the containers but keeps the database data. If you want to wipe the database
completely and start fresh next time (a clean install test), run:

```
docker compose down -v
```

## Troubleshooting

- **"Cannot connect to the Docker daemon"**: Docker Desktop isn't running yet. Open the
  Docker Desktop app, wait for it to say "Running", then try again.

- **First run feels slow**: normal, it's downloading and building everything for the
  first time. Just let it finish, every run after this is fast.

- **"no space left on device"**: free up a few GB, or clear old Docker images first:

```
docker system prune -a
```

- **"Port is already allocated"**: something else is using the port, usually another
  Docker project. Check what's running:

```
docker ps
```

  Stop it from its own project folder (`docker compose down`), then run
  `docker compose up` here again. If it's not Docker, find the program using the port:

```
# Mac / Linux
lsof -i :5173

# Windows
netstat -ano | findstr :5173
```

  Then stop it: `kill -9 <PID>` (Mac/Linux) or `taskkill /PID <PID> /F` (Windows).

- **"docker: 'compose' is not a docker command"**: your Docker is older, use the hyphen
  version instead:

```
docker-compose up
```

- **Backend container exits right after starting**: it's set to restart itself
  automatically. If it doesn't come back, just run:

```
docker compose up
```

- **App looks blank or can't reach the backend**: the page loaded before the backend
  was ready. Wait for the `Local: http://localhost:5173/` log line, then hard refresh
  (Ctrl+Shift+R, or Cmd+Shift+R on Mac).

- **`psql` count returns 0 or a missing table error**: the data is still loading, wait a
  few seconds and run the same command again.

- **Login fails despite the hint text**: check for extra spaces in the boxes, or reset
  the database:

```
docker compose down -v
docker compose up
```

- **On Windows**: Docker Desktop needs WSL2, it will prompt you to enable it if missing.

- **Changes to code not showing up**: rebuild after editing anything in `backend/` or
  `frontend/`:

```
docker compose up --build
```
