# Sa3i Productivity Frontend

Angular frontend for Sa3i, a full-stack productivity app focused on daily planning, task organization, calendar scheduling, Kanban workflow management, and profile analytics.

The frontend is built with Angular, Angular Material, Angular CDK Drag Drop, reactive forms, standalone components, and service-based API integration.
backend repo: https://github.com/abdelrahman-m123/Sa3i_productivity_backend

## Demo

![Sa3i frontend demo](<./demo.gif>)

## Feature Breakdown

### Authentication

The app includes signup and login flows connected to the backend API.

- Signup form with validation.
- Login form with loading and server-error states.
- JWT token persistence through `localStorage`.
- Automatic session restoration after refresh.
- Header state updates based on logged-in or logged-out status.
- Logout clears the session and redirects back to login.

### App Shell

The main app layout is designed like a productivity workspace rather than a landing page.

- Sticky header that remains visible while scrolling.
- Sticky sidebar navigation.
- Protected-workspace style layout for dashboard, tasks, calendar, Kanban, and profile pages.
- Full-width responsive content area.
- Auth pages use a centered layout without the sidebar.

### Task List

The task list is the core CRUD surface for managing user tasks.

- View all user tasks.
- Add tasks through a Material dialog.
- Edit existing tasks through a dialog.
- Delete tasks.
- Mark tasks complete or incomplete.
- Display priority and category as chips.
- Task state is synced with the backend API.

Task fields supported by the UI include:

- Title
- Description
- Priority: low, medium, high
- Category
- Due date
- Completion state

### Dashboard

The dashboard helps users decide what to work on based on available energy or effort.

Effort modes:

- Minimum: shows only high-priority tasks that are due today or overdue.
- Normal: shows tasks due today and overdue tasks.
- Maximum: shows due/overdue tasks plus upcoming tasks from the next few days.

Dashboard capabilities:

- Quick completion checkbox.
- Counts for due today, overdue, and high-priority tasks.
- Sorted task plan based on due date and priority.
- Empty state when there are no matching tasks for the selected effort level.

This turns the task list into a planning assistant rather than just a storage screen.

### Calendar

The calendar page shows tasks grouped by due date in a monthly planner view.

- Month navigation.
- Jump back to today.
- Tasks displayed inside their assigned day.
- Add a task directly to a specific day.
- The Add Task dialog is prefilled with the selected date.
- Unscheduled tasks are shown separately.
- Completed tasks are visually muted.
- Priority and category tags are shown inside each task card.

Drag-and-drop scheduling:

- Drag a task from one calendar day to another.
- The task due date updates immediately in the UI.
- The new date is persisted to the backend.
- If the backend update fails, the UI rolls the task back to the previous date.

### Kanban Board

The Kanban page gives users a workflow-based view of their tasks.

Columns:

- Todo
- In Progress
- Done

Kanban capabilities:

- Drag tasks between columns.
- Persist task status changes to the backend.
- Move tasks within a column.
- Dropping a task into Done marks it completed.
- Moving a completed task back out of Done marks it active again.
- Add a new task from the Kanban toolbar.
- Display priority, category, and due date on each card.
- Empty column drop zones make drag-and-drop clear.

This feature demonstrates Angular CDK drag-and-drop with real API persistence.

### Profile

The profile page combines user account management with productivity analytics.

Editable profile fields:

- Name
- Email
- Profile photo

Profile editing features:

- Edit and cancel modes.
- Reactive form validation.
- Image upload support.
- Success and error messages.
- Header/profile image refreshes after saving changes.

### Profile Analytics

The profile page also includes task analytics for the logged-in user.

Analytics shown:

- Total tasks
- Completed tasks
- Pending tasks
- Tasks due today
- Overdue tasks
- High-priority active tasks
- Completion rate percentage

These analytics are calculated from the user's task data on the frontend.

### Responsive UI

The UI is built to stay usable across different viewport sizes.

- Dashboard stat cards collapse on smaller screens.
- Calendar changes from a 7-column grid to stacked day sections on smaller screens.
- Kanban columns stack vertically on smaller screens.
- Text and tags are constrained to avoid overflowing task cards.
- Sticky navigation keeps the main workflow easy to reach.

## Tech Stack

- Angular 20
- Angular Material
- Angular CDK Drag Drop
- RxJS
- TypeScript
- Reactive Forms
- Standalone Angular Components

## Important Frontend Folders

```text
src/app/
├── add-task/        # Dialog for creating tasks
├── calendar/        # Month planner and drag-to-reschedule UI
├── dashboard/       # Effort-based daily planning
├── header/          # Auth-aware top navigation
├── kanban/          # Drag-and-drop task workflow board
├── login/           # Login form
├── profile/         # Profile edit and analytics
├── services/        # Auth and task API services
├── sidebar/         # Sticky workspace navigation
├── signup/          # Signup form
├── tasklist/        # Main task CRUD list
└── update-task/     # Dialog for editing tasks
```

## API Integration

The frontend expects the backend to run at:

```text
http://localhost:3000
```

Main service files:

- `src/app/services/authusers.ts`
- `src/app/services/usertasks.ts`

The frontend communicates with authenticated endpoints using the JWT token stored after login/signup.

## Routes

| Route | Description |
| --- | --- |
| `/signup` | Create a new account |
| `/login` | Sign in |
| `/dashboard` | Effort-based daily task plan |
| `/tasks` | Task CRUD list |
| `/calendar` | Monthly calendar scheduler |
| `/kanban` | Drag-and-drop task workflow board |
| `/profile` | Profile editing and productivity analytics |

## Run Locally

Install dependencies:

```bash
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

## Useful Commands

Run development server:

```bash
npm start
```

Build the app:

```bash
npm run build
```

Run TypeScript validation:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Demo Account

Seeded demo users can be created from the backend project with:

```bash
npm run seed:test-user
```

or:

```bash
npm run seed:test-user -- abdelrahman11034@gmail.com Abdelrahman
```

Demo password:

```text
password123
```

## Portfolio Highlights

This frontend is designed to demonstrate more than basic CRUD. It shows:

- Auth-aware UI state.
- Reusable API services.
- Reactive form handling.
- Material dialog workflows.
- Drag-and-drop interactions with persisted updates.
- Calendar-based scheduling.
- Kanban workflow management.
- Dashboard-style task prioritization.
- User profile editing with upload support.
- Task analytics presented in a clean UI.
