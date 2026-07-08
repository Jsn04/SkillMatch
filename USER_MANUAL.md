# User Manual

This explains how to actually use SkillMatch once it is running (see INSTALLATION.md if
you have not got it running yet). It walks through the app screen by screen.

## Who this app is for

SkillMatch is meant to be used by project managers who need to staff engineers onto
client projects. You describe what a project needs, and the app searches the whole
engineer bench and shows you who fits best.

## 1. Logging in

When you open the app (http://localhost:5173) you land on the login screen first, not
the matcher. This is because assigning engineers to projects is something only a logged
in manager should be able to do.

You have two options here:

**Use the default account** (fastest way to try the app):
- email: `manager@skillmatch.com`
- password: `password123`

These are already shown inside the email and password boxes as a hint, so you can just
click "Login" without typing anything.

**Create your own account**: click "Create one" underneath the login form, fill in any
email and password, and you will be logged straight in.

You stay logged in even if you refresh the page. Click "Logout" in the top bar whenever
you want to log out.

## 2. The main screen (the matcher)

Once logged in you see the search form. Here is what each part does:

**Project name** - type the name of the project you are staffing, for example "Payments
revamp". This is only used later if you assign someone to it, so the app knows which
project they were put on.

**Tech Stack** - pick the kind of engineer you need: Frontend, Backend, Data / Database,
DevOps, Cloud, Networking, AI / ML, or Other. Leave it on "Any tech stack" if you do not
want to narrow it down.

**The five sliders/dropdowns** - these describe the level the project needs for:
- **Experience Level** (Junior, Mid-level, Senior, Principal / Architect)
- **Domain Expertise** (Generalist, Some exposure, Experienced, Deep specialist)
- **Communication Skill** (Basic, Good, Strong, Excellent) - how client-facing the role is
- **Timezone** (Flexible, Some overlap, Full overlap) - how much the engineer needs to
  overlap with your working hours
- **Availability** (Advisory / light, Part-time, Most of the week, Full-time) - how much
  of their time the project needs

**Industry** - optionally filter to engineers who have worked in a specific industry
(FinTech, Healthcare, Gaming, and so on). Leave it on "Any industry" to search everyone.

**Match by** - this is the important one, it changes how the search behaves:
- **Exact fit**: finds engineers whose levels are close to exactly what you asked for,
  and only shows people who are not already fully booked elsewhere. Use this when you
  need to fill a seat right now.
- **Potential fit**: finds engineers whose overall balance of skills points the same
  direction as what you asked for, even if their exact levels are a bit lower. This also
  includes engineers who are currently busy on something else, since you are scouting
  ahead rather than staffing today.

Click **Find engineers** to run the search.

## 3. Reading the results

Each result shows:
- the engineer's name, tech stack, region, industry, and years of experience
- their current availability, shown as a small coloured badge:
  - green "Available now"
  - yellow "Partially free, full in Xw" (X = weeks until fully booked)
  - red "Fully booked, free in Xw" - note this one only appears under "Potential fit".
    Under "Exact fit" a fully booked engineer is never shown at all (see above), and
    even under "Potential fit" only a small share of the bench is fully booked at any
    time, so you may need to try a few searches before one shows up in your results.
- a match percentage on the right (higher = closer to what you asked for)
- an "Assign" button

If very few engineers match, you will see a hint suggesting you widen the tech stack or
industry filter. If nothing matches at all, you will see a message saying so.

## 4. Assigning an engineer to your project

Once you have found someone good:
1. Make sure you typed a project name at the top of the form (if you did not, the app
   will remind you to).
2. Click **Assign** on their result row.
3. They now appear under **Current assignments** at the bottom of the page, showing
   their name and the project they were put on.
4. They also disappear from the "Best matches" list above, since they are no longer a
   free option to suggest for other searches.

## 5. Removing an assignment

Under **Current assignments**, click **Remove** next to any entry to take that engineer
off the project. They will show up again in future searches once removed.

## 6. Logging out

Click **Logout** in the top bar. This clears your session and sends you back to the
login screen. Anyone using the app after that will need to log in again before they can
search or assign anyone.
