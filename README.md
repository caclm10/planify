# Planify - Project Management Workspace

Planify is a real-time, collaborative project management web application built with modern web technologies. Manage multiple projects, track tasks via a drag-and-drop Kanban board, monitor milestones, and store resources seamlessly.

## Features

- **Multi-Project Dashboard:** Create and manage multiple projects from a centralized dashboard.
- **Real-time Kanban Board:** Drag and drop tasks across columns with live updates synchronized across all connected clients.
- **Milestone Tracker:** Track major project phases with automated progress bars based on task completion.
- **Resource Drive:** Securely upload file attachments or save external links relevant to the project.
- **Team Collaboration:** Invite members to your projects and assign tasks dynamically.
- **Role-based Access Control:** Projects and their contents are securely locked to authorized members.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **UI Components:** Shadcn UI (Radix Primitives)
- **Backend & Database:** PocketBase (Go & SQLite)
- **Styling:** Glassmorphism, Dark Mode Support, CSS variables

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start PocketBase Backend
Navigate to the `pocketbase` directory and start the local server:
```bash
./pocketbase/pocketbase serve
```
The PocketBase Admin UI will be available at `http://127.0.0.1:8090/_/`

### 3. Database Configuration
1. Login to the PocketBase Admin UI (create an admin account if it's your first time).
2. Create 4 collections: `projects`, `tasks`, `milestones`, and `resources`.
3. Set the API rules for all collections to allow authenticated users (e.g., `project_id.members ?= @request.auth.id`).
4. Add an `order` (Number) field to the `tasks` collection to enable Drag & Drop sorting.

### 4. Start Frontend Dev Server
In the root directory, run:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
