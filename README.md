# Sa3i Productivity

Sa3i is a full-stack productivity workspace for turning goals into tasks, scheduling real calendar time, moving work through a Kanban flow, and reviewing personal productivity analytics.

The project is organized as a monorepo with an Angular frontend and a Node.js/Express API backed by MongoDB.

## Product Demo

[![Watch the Sa3i product tour](frontend/public/sa3i-logo.png)](frontend/public/sa3i-product-tour.mp4)

[Watch the MP4 product tour](frontend/public/sa3i-product-tour.mp4)

The landing page also uses this MP4 as an autoplaying, muted, looping product showcase while the hero section is visible.

## Features

- JWT signup, login, persisted sessions, and authenticated API requests.
- One-click demo mode seeded with sample tasks.
- Demo write protection: visitors can explore safely, with task checking and task movement allowed in Calendar and Kanban while destructive or full-edit writes are blocked.
- Toast notifications explain when demo mode prevents saving changes.
- Task creation, editing, deletion, completion, priorities, categories, due dates, scheduled time blocks, and workflow status.
- Effort-based dashboard plans for minimum, normal, and maximum focus days.
- Monthly calendar with drag-and-drop rescheduling, scheduled task blocks, and unscheduled task handling.
- Kanban board with Todo, In Progress, and Done columns.
- AI planner powered by Gemini: enter a goal, preview structured tasks, adjust inclusion/title/estimate, review scheduled slots, regenerate, cancel, or confirm.
- AI planner preview includes clearer count badges for selected steps, total minutes, and scheduled items.
- Editable user profiles with profile-photo uploads.
- Profile analytics for totals, completion rate, pending work, due dates, overdue work, and priority mix.
- Responsive Angular Material interface with a sticky header, workspace sidebar, and product-led landing page.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Angular 20, Angular Material, Angular CDK, RxJS, TypeScript |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| AI planning | Google Gemini API with structured JSON output |
| Scheduling | Backend scheduling service with time-zone and working-hour support |
| Authentication | JSON Web Tokens and bcryptjs |
| Uploads | Multer and Express static files |

## Repository Structure

```text
.
├── backend/
│   ├── config/             # MongoDB connection
│   ├── controllers/        # Auth, task, and planner controllers
│   ├── middleware/         # Upload and multer error middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   ├── scripts/            # Demo-data seeding
│   ├── services/           # Gemini planner and scheduler
│   ├── test/               # Node test suite
│   ├── uploads/            # User profile images
│   └── package.json
├── frontend/
│   ├── public/             # Logos, favicon, product tour MP4
│   ├── src/app/
│   │   ├── calendar/       # Monthly planner and rescheduling
│   │   ├── dashboard/      # Effort-based daily plan
│   │   ├── goal-planner/   # AI goal-to-calendar workflow
│   │   ├── kanban/         # Task workflow board
│   │   ├── landing/        # Product landing page
│   │   ├── profile/        # Account editing and analytics
│   │   ├── services/       # Auth, task, and planner API clients
│   │   └── tasklist/       # Main task management view
│   └── package.json
└── demo/
    └── .mp4               # Source copy of the product tour video
```

## Prerequisites

- Node.js and npm
- A local or hosted MongoDB database
- A Gemini API key for AI planning

## Local Setup

Clone the repository:

```bash
git clone https://github.com/abdelrahman-m123/sa3i_productivity_frontend.git
cd sa3i_productivity_frontend
```

Install both applications:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=productivity_app
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=models/gemini-3.6-flash
GEMINI_TIMEOUT_MS=90000
```

Seed the demo account and sample tasks:

```bash
npm --prefix backend run seed:demo
```

Start the backend:

```bash
npm --prefix backend start
```

Start the frontend in another terminal:

```bash
npm --prefix frontend start -- --host 127.0.0.1 --port 4200
```

Open [http://127.0.0.1:4200](http://127.0.0.1:4200). The frontend expects the API at `http://localhost:3000`.

## Demo Mode

The landing page and login screen include an **Explore demo** action that starts a session through `/users/demo`. Demo credentials are not embedded in the frontend.

For local manual login after seeding:

```text
Email: test@example.com
Password: password123
```

Demo mode is intentionally restricted:

- Allowed: checking tasks in Calendar and Kanban.
- Allowed: moving tasks across Calendar days and Kanban columns.
- Blocked: creating tasks, deleting tasks, editing task details, saving AI-generated tasks, and editing the profile.
- Blocked actions return a `403` response and show a frontend toast explaining that writes are not allowed during the demo.

To customize the seeded demo account:

```bash
npm --prefix backend run seed:demo -- user@example.com "Demo User"
```

## Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Product landing page with autoplaying MP4 showcase |
| `/signup` | Create an account |
| `/login` | Sign in or start demo mode |
| `/dashboard` | Build an effort-based daily plan |
| `/tasks` | Create and manage tasks |
| `/calendar` | Schedule and move tasks in a monthly calendar |
| `/planner` | Turn a plain-language goal into scheduled tasks |
| `/kanban` | Move tasks through workflow stages |
| `/profile` | Edit the profile and view analytics |

## API Reference

Authenticated endpoints require an `Authorization: Bearer <token>` header.

### Users

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/users/signup` | No | Create an account; accepts optional `photo` upload |
| `POST` | `/users/login` | No | Authenticate and receive a JWT |
| `POST` | `/users/demo` | No | Start a seeded demo session |
| `GET` | `/users` | Yes | List users |
| `GET` | `/users/profile` | Yes | Get the current profile |
| `PATCH` | `/users/profile` | Yes | Update name, email, or profile photo |

### Tasks

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/tasks` | Yes | Create a task for the current user |
| `GET` | `/tasks` | Yes | List the current user's tasks |
| `GET` | `/tasks/:id` | Yes | Get one task |
| `PATCH` | `/tasks/:id` | Yes | Update task details, schedule, completion, or status |
| `DELETE` | `/tasks/:id` | Yes | Delete a task |
| `GET` | `/tasks/user/:userId` | Yes | List tasks for a specified user ID |

### AI Planning

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/ai-plans/preview` | Yes | Ask Gemini for a structured goal breakdown and preview scheduled slots |
| `POST` | `/ai-plans/confirm` | Yes | Recheck availability and save selected plan items as tasks |

Gemini proposes task metadata and effort estimates. The backend validates the proposal and owns calendar placement. Confirmation reruns scheduling before saving.

Task workflow statuses are `todo`, `inProgress`, and `done`. Priorities are `low`, `medium`, and `high`; categories are `work`, `personal`, `study`, `health`, and `other`.

## Useful Commands

Run these commands from the repository root.

| Command | Purpose |
| --- | --- |
| `npm --prefix frontend start` | Start the Angular development server |
| `npm --prefix frontend run build` | Create a production frontend build |
| `npm --prefix frontend exec -- tsc -p tsconfig.app.json --noEmit` | Type-check the frontend |
| `npm --prefix backend start` | Start the API server |
| `npm --prefix backend test` | Run backend unit tests |
| `npm --prefix backend run seed:demo` | Seed the demo mode account and tasks |

## How the App Fits Together

1. Angular authenticates against `/users/signup`, `/users/login`, or `/users/demo`.
2. The returned JWT is stored locally and added to protected API requests.
3. Express validates the token and loads the current user.
4. Demo-write middleware blocks unsafe demo mutations while allowing limited task movement/checking.
5. Mongoose persists users, tasks, and saved AI goal plans in MongoDB.
6. Gemini returns structured task proposals; the backend scheduler assigns calendar slots around existing commitments.
7. Calendar and Kanban use the same task API so each view stays in sync.
8. Profile images are uploaded through Multer and served from `/uploads`.

## Engineering Notes

Sa3i separates task generation from calendar placement. Angular provides the workspace; Express handles authenticated API requests, calls Gemini for task proposals, runs scheduling logic, and persists users, plans, and tasks in MongoDB.

### Structured AI Proposals

`backend/services/gemini-planner.js` requests structured JSON output from Gemini. The planner controller validates and normalizes titles, durations, priorities, categories, assumptions, and deadlines before any plan can be saved.

### Backend Scheduling

`backend/services/scheduler.js` places proposed tasks around existing bookings using working hours, weekends, deadlines, and time-zone preferences. Confirmation checks availability again before saving. This reduces stale-preview conflicts, though transactional reservation would be a future improvement for simultaneous writes.

### Demo Safety

`backend/controllers/auth.controllers.js` includes a demo write guard. Full creates, edits, deletes, profile updates, and AI plan saves are blocked for demo sessions. Limited task patches are allowed only for completion/status and calendar scheduling fields, matching the interactive demo affordances.

### Authenticated Task Access

JWT middleware identifies the requester. Standard task listing, individual reads, updates, and deletes scope database queries to the authenticated user. The legacy `/tasks/user/:userId` endpoint still needs an explicit ownership check; this project does not claim a completed security audit.

### Explore the Implementation

- [Angular workspace](frontend/src/app)
- [Landing page](frontend/src/app/landing)
- [Demo write guard](backend/controllers/auth.controllers.js)
- [Planner controller](backend/controllers/planner.controllers.js)
- [Scheduling service](backend/services/scheduler.js)
- [Backend tests](backend/test)

The landing page's portfolio-planning example is illustrative, not a live model response. Open the demo to explore the actual workspace; AI generation requires backend Gemini configuration.
