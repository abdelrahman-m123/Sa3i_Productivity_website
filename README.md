# Sa3i Productivity App

Sa3i is a full-stack productivity app for planning tasks across a dashboard, calendar, Kanban board, and profile analytics. It is built as a portfolio project to show authenticated CRUD workflows, date-based planning, drag-and-drop interactions, profile management, and a Node/MongoDB API.

## App Overview

![Sa3i app overview](<screenshots/ScreenRecording2026-07-21135431-ezgif.com-video-to-gif-converter (1).gif>)

## Features

- JWT authentication with signup, login, logout, protected task APIs, and persisted sessions.
- Task CRUD with priority, category, completion state, due date, and Kanban status.
- Dashboard that adapts today's task plan by effort level:
  - Minimum: high-priority due/overdue tasks.
  - Normal: due today and overdue tasks.
  - Maximum: due/overdue tasks plus upcoming tasks pulled forward.
- Calendar month view with tasks grouped by day.
- Drag-and-drop calendar rescheduling.
- Kanban board with Todo, In Progress, and Done columns.
- Editable user profile with profile photo upload.
- Profile analytics for total, completed, pending, due today, overdue, high-priority tasks, and completion rate.
- Sticky header and sidebar layout.

## Tech Stack

- Frontend: Angular, Angular Material, Angular CDK Drag Drop, RxJS, TypeScript
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT, bcrypt
- Uploads: Multer

## Project Structure

```text
.
├── screenshots/
├── sa3i_productivity_backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   └── server.js
└── sa3i_productivity_frontend/
    └── src/app/
        ├── calendar/
        ├── dashboard/
        ├── kanban/
        ├── profile/
        ├── services/
        └── tasklist/
```

## Getting Started

Install backend dependencies:

```bash
cd sa3i_productivity_backend
npm install
```

Create `sa3i_productivity_backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
d_bName=productivity_app
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

Start the backend:

```bash
npm start
```

Install frontend dependencies:

```bash
cd ../sa3i_productivity_frontend
npm install
```

Start the frontend:

```bash
npx ng serve --host 127.0.0.1 --port 4200
```

Open:

```text
http://127.0.0.1:4200
```

## Seed Demo Data

Seed the default test user:

```bash
cd sa3i_productivity_backend
npm run seed:test-user
```

Seed a specific user:

```bash
npm run seed:test-user -- abdelrahman11034@gmail.com Abdelrahman
```

Demo password:

```text
password123
```

## API Highlights

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/users/signup` | Create account with optional profile photo |
| `POST` | `/users/login` | Login and receive JWT |
| `GET` | `/users/profile` | Get current user profile |
| `PATCH` | `/users/profile` | Update name, email, and photo |
| `GET` | `/tasks` | Get current user's tasks |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task, due date, completion, or status |
| `DELETE` | `/tasks/:id` | Delete task |

## Portfolio Notes

This project demonstrates a realistic productivity workflow rather than only simple CRUD. The strongest areas to highlight are the effort-based dashboard planning, drag-and-drop calendar scheduling, Kanban status persistence, profile analytics, and authenticated full-stack API integration.
