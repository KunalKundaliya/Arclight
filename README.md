# Ancient One’s Trials — ArcLight Recruitment Scheduler

An intelligent recruitment interview scheduling and coordination platform built for university campus placements, hackathons, and high-volume multi-stage engineering recruitment pipelines.

---

## 🏗️ Project Architecture (Separated Full-Stack)

The project is structured with complete separation between the **Frontend** and **Backend**:

```
arcLight/
├── backend/                       # Node.js + Express REST API Server
│   ├── server.js                  # Express application entry point (Port 5000)
│   ├── package.json               # Backend dependencies (express, cors)
│   └── src/
│       ├── data/                  # Seed dataset for Webster 2026 / Northstar Labs
│       ├── services/
│       │   ├── dbService.js       # In-memory database with CRUD & reset capabilities
│       │   └── schedulerEngine.js # Deterministic CSP Solver engine
│       └── routes/
│           ├── drivesRoutes.js       # /api/drives
│           ├── candidatesRoutes.js   # /api/candidates
│           ├── interviewersRoutes.js # /api/interviewers
│           ├── roomsRoutes.js        # /api/rooms
│           ├── interviewsRoutes.js   # /api/interviews
│           ├── schedulerRoutes.js    # /api/scheduler/solve
│           ├── evaluationsRoutes.js  # /api/evaluations
│           └── reportsRoutes.js      # /api/reports
│
├── frontend/                      # React + Vite + Tailwind CSS Single Page App
│   ├── index.html                 # Entry HTML
│   ├── vite.config.js             # Vite configuration with /api proxy to Port 5000
│   ├── tailwind.config.js         # Design system & tokens
│   ├── package.json               # Frontend dependencies (React 19, Lucide, Recharts)
│   └── src/
│       ├── components/            # Reusable UI primitives (tables, modals, badges, cards)
│       ├── layouts/               # Role-based layouts (Public, Coordinator, Interviewer, Candidate)
│       ├── pages/                 # Full route pages
│       ├── context/               # Auth & Toast notifications context
│       ├── services/
│       │   ├── apiClient.js       # Async client connecting to /api endpoints
│       │   ├── schedulerService.js# CSP engine connector with resilient fallback
│       │   └── storageService.js  # State management & background API sync
│       └── data/                  # Local seed & fallback data
│
├── package.json                   # Root orchestrator with concurrently scripts
└── README.md                      # Full setup & documentation
```

---

## 🚀 Running the Project

### Prerequisites
- **Node.js**: v18+ (tested on Node v24.12.0)
- **npm**: v9+

### Option 1: Run Full-Stack (Backend + Frontend Together)
From the project root (`arcLight/`):

```bash
# 1. Install all dependencies (root, backend, and frontend)
npm run install:all

# 2. Start both Backend and Frontend concurrently
npm run dev
```

* **Frontend UI**: [http://localhost:5173/](http://localhost:5173/)
* **Backend API**: [http://localhost:5000/](http://localhost:5000/)
* **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option 2: Run Separately in VS Code / Multiple Terminals

#### Terminal 1 — Backend API Server
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

#### Terminal 2 — Frontend Application
```bash
cd frontend
npm run dev
# Vite server running at http://localhost:5173
```

*(Note: The frontend automatically proxies all `/api/*` calls to `http://localhost:5000` via Vite)*

---

### Option 3: Production Build
```bash
npm run build
```
Creates an optimized production bundle in `frontend/dist/`.

---

## 📡 Backend REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and API endpoint directory |
| `GET` | `/api/drives` | List all active and past recruitment drives |
| `POST` | `/api/drives` | Create a new recruitment drive |
| `PUT` | `/api/drives/:id` | Update recruitment drive details |
| `DELETE` | `/api/drives/:id` | Remove a recruitment drive |
| `GET` | `/api/candidates` | List candidates (supports `driveId`, `status`, `round` query filters) |
| `POST` | `/api/candidates` | Register a new applicant into the pipeline |
| `PUT` | `/api/candidates/:id` | Update candidate status or round progression |
| `DELETE` | `/api/candidates/:id` | Remove candidate from pipeline |
| `GET` | `/api/interviewers` | List faculty interviewers with availability summary |
| `POST` | `/api/interviewers` | Onboard an interviewer to the panel |
| `PUT` | `/api/interviewers/:id` | Update interviewer availability or caps |
| `GET` | `/api/rooms` | List interview chambers and capacities |
| `POST` | `/api/rooms` | Register a new interview chamber |
| `GET` | `/api/interviews` | List scheduled interview sessions |
| `POST` | `/api/interviews` | Book / schedule an interview session |
| `POST` | `/api/scheduler/solve` | **Run Deterministic CSP Solver Engine** |
| `GET` | `/api/evaluations` | List standardized rubric evaluation scorecards |
| `POST` | `/api/evaluations` | Submit candidate rubric assessment |
| `GET` | `/api/reports` | Throughput, funnel progress, and capacity metrics |
| `POST` | `/api/reports/reset` | Reset dataset to initial Webster 2026 state |

---

## 🧠 Server-Side Constraint Satisfaction Solver (CSP)

The backend scheduler engine (`backend/src/services/schedulerEngine.js`) solves interview distribution deterministically:
1. **Interviewer Availability & Daily Limits**: Enforces faculty workload caps (maximum 3–4 interviews per day).
2. **Room Capacities**: Ensures no physical chamber or virtual room is double-booked in the same time slot.
3. **Buffer Management**: Detects consecutive sessions without rest buffers and flags warnings.
4. **Fulfillment Telemetry**: Returns total variables evaluated, solve time in milliseconds, scheduled count, conflicts detected, and unscheduled queue.

---

## 🔑 Demo Personas

Switch between personas using the top-right profile avatar or on the `/login` screen:

1. **Coordinator Workspace (`/coordinator`)**
   * Persona: **Maya Chen** (Lead Campus Placement Coordinator)
   * Capabilities: Placement drives, CSP AI scheduler, master calendar, pipeline tracking, reports.
2. **Interviewer Terminal (`/interviewer`)**
   * Persona: **Priya Nair / Dr. Evelyn Voss** (Senior Faculty Assessor)
   * Capabilities: Availability manager, personal session calendar, standardized 4-metric scorecards.
3. **Candidate Portal (`/candidate`)**
   * Persona: **Aanya Shah** (Software Engineering Applicant)
   * Capabilities: Conflict-free self-booking, room join links, stage progression tracker.

---

## 👥 Team & Contributor Division (3 Core Pillars)

The codebase is modularly divided across 3 specialized engineering tracks. For complete file-by-file ownership and GitHub setup, see [CONTRIBUTORS.md](file:///d:/arcLight/CONTRIBUTORS.md):

1. **🎨 Contributor 1 — Frontend Lead** (`frontend/**`)
   - 27+ responsive role pages, React 19 architecture, Tailwind design tokens, real-time client state & notifications.
2. **⚙️ Contributor 2 — Backend & Database Lead** (`backend/**` excluding scheduler engine)
   - Node/Express REST API, PostgreSQL relational schema, JWT RBAC security, Server-Sent Events (SSE) telemetry.
3. **🧠 Contributor 3 — Algorithm & Optimization Lead** (`backend/src/services/scheduler/**`)
   - Deterministic CSP solver (MRV, LCV, Forward Checking), soft constraint optimizer, dynamic rescheduling repair engine, and formal mathematical test suites.

