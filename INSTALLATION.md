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

- **"Cannot connect to the Docker daemon"**: Docker Desktop is not actually running yet,
  just installed. Open the Docker Desktop app and wait for it to say it's running, then
  try again.
- **First run feels slow / stuck on a fresh machine**: this is normal. On the very first
  run, Docker has to download the Postgres, Python and Node base images and then build
  the project's own images, which can take a few minutes depending on your internet
  speed, not just "a minute or two" if your connection is slower. Let it finish, every
  run after this one is fast since everything is cached.
- **Build fails partway with a "no space left on device" type error**: the image pull
  and build needs a few GB free. Free up some disk space and run `docker compose up`
  again, it picks up where it left off.
- **"Port is already allocated" error**: something else on your machine is already using
  port 5173, 8000, or 5432. It's usually another Docker project. First check what's
  running:

```
docker ps
```

  If you see another project's containers in the list, stop that project (run
  `docker compose down` from that project's own folder), then run `docker compose up`
  here again.

  If it's not Docker, something else on your machine is using the port. Find out what,
  then close it or stop it:

```
# Mac / Linux, replace 5173 with the port from the error
lsof -i :5173

# Windows (Command Prompt), replace 5173 with the port from the error
netstat -ano | findstr :5173
```

  On Mac/Linux this prints the program's PID, which you can stop with `kill -9 <PID>`.
  On Windows the last number in the row is the PID, which you can stop with
  `taskkill /PID <PID> /F`.

  If you would rather not close the other program, you can instead change the port
  SkillMatch uses. Open `docker-compose.yml` and change the left side of the matching
  `ports:` line, for example `"5174:5173"` instead of `"5173:5173"`, then open the app
  at that new port instead (`http://localhost:5174` in this example).
- **"docker: 'compose' is not a docker command"**: your Docker install is older and uses
  the standalone `docker-compose` (with a hyphen) instead of the newer `docker compose`
  (a space). Just use `docker-compose up` instead everywhere in this guide.
- **Backend container exits right after starting**: this should not really happen, since
  the backend is set to wait for the database's healthcheck before it even starts, and it
  is also set to restart automatically if it ever does fail to connect. If you do see it
  exit, just give it a few seconds, Docker will restart it on its own without you needing
  to run anything again.
- **App opens but looks blank or can't reach the backend**: this usually just means the
  page loaded before the backend was fully ready, or your browser cached an older
  version. Wait for the `Local: http://localhost:5173/` log line, then hard refresh the
  page (Ctrl+Shift+R, or Cmd+Shift+R on Mac).
- **The `psql` count command returns 0 or an error about a missing table**: the backend
  is probably still busy loading the 3000 engineers. Wait a few seconds and run the
  command again.
- **Login fails even with the hint text filled in**: double check there is no extra
  space typed into the box. If it still fails, the database may be left over from an
  earlier partial run, run `docker compose down -v` and start again for a clean database.
- **On Windows**: Docker Desktop needs WSL2 turned on, Docker Desktop will prompt you to
  enable it if it is missing. Everything else in this guide works the same in a WSL2
  terminal or PowerShell.
- **Changes to code not showing up**: this project rebuilds the images fresh each time,
  so if you edit any file in `backend/` or `frontend/`, run this to see the change:

```
docker compose up --build
```
