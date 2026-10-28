# ArcLight — Project Contributors & Architectural Division

This document outlines the ownership, file division, and technical responsibilities for the 3 core contributors of the **ArcLight** automated recruitment scheduling platform.

---

## 👥 Contributor Overview & Responsibilities

| Contributor | Focus Area | Primary Tech Stack | Key Architectural Component |
| :--- | :--- | :--- | :--- |
| **Contributor 1: Frontend Lead** | User Experience, Design System, Portals | React 19, Vite, Tailwind CSS, Lucide | 3 Role Portals (Coordinator, Interviewer, Candidate), Real-Time UI, RBAC Routing |
| **Contributor 2: Backend Lead** | REST API, Database Architecture, Security | Node.js, Express, PostgreSQL, JWT | Relational DB Schema, Auth/RBAC Middleware, SSE Event Bus, CRUD Services |
| **Contributor 3: Algorithm Lead** | CSP Solver, Heuristics, Optimization | Pure JavaScript (ESM), Algorithmic Heuristics, Jest/Node Test | Constraint Satisfaction Engine, MRV/LCV Backtracking, Dynamic Repair Engine |

---

## 📁 Detailed File & Directory Division

```
arcLight/
│
├── 🎨 FRONTEND LEAD (Contributor 1)
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── public/               # LandingPage, LoginPage, SignUpPage
│   │   │   │   ├── coordinator/          # 12 coordinator management pages (Drives, Candidates, Scheduler UI, etc.)
│   │   │   │   ├── interviewer/          # 7 interviewer portals (Dashboard, Availability, Scorecards, Calendar)
│   │   │   │   └── candidate/            # 8 candidate self-service pages (Dashboard, Booking, Progress, Profile)
│   │   │   ├── components/               # PageHeader, StatCard, Modals, Badges, StatusTags, Timelines
│   │   │   ├── layouts/                  # CoordinatorLayout, InterviewerLayout, CandidateLayout, PublicLayout
│   │   │   ├── context/                  # AuthContext.jsx, ToastContext.jsx, RealtimeContext.jsx
│   │   │   ├── services/
│   │   │   │   ├── storageService.js     # State management & background API sync
│   │   │   │   └── apiClient.js          # REST client wrapper
│   │   │   ├── data/mockDrives.js        # Seed UI prototypes & test mock data
│   │   │   ├── index.css                 # Design tokens, typography, glassmorphism, animations
│   │   │   └── App.jsx                   # React Router architecture & protected role guards
│   │   ├── vite.config.js                # Frontend dev server & proxy settings
│   │   ├── tailwind.config.js            # Design system palette & typography
│   │   └── package.json                  # Frontend dependencies
│
├── ⚙️ BACKEND & DATABASE LEAD (Contributor 2)
│   ├── backend/
│   │   ├── server.js                     # Express app initialization, CORS, SSE streaming endpoints
│   │   ├── src/
│   │   │   ├── db/                       # PostgreSQL connection pool & database DDL migrations
│   │   │   ├── config/                   # Environment variables & database credentials
│   │   │   ├── routes/                   # REST API routing
│   │   │   │   ├── authRoutes.js         # /api/auth (login, register, me)
│   │   │   │   ├── drivesRoutes.js       # /api/drives
│   │   │   │   ├── candidatesRoutes.js   # /api/candidates
│   │   │   │   ├── interviewersRoutes.js # /api/interviewers
│   │   │   │   ├── roomsRoutes.js        # /api/rooms
│   │   │   │   ├── interviewsRoutes.js   # /api/interviews
│   │   │   │   ├── evaluationsRoutes.js  # /api/evaluations
│   │   │   │   ├── notificationsRoutes.js# /api/notifications
│   │   │   │   ├── reportsRoutes.js      # /api/reports
│   │   │   │   └── eventsRoutes.js       # /api/events (Server-Sent Events streaming)
│   │   │   ├── controllers/              # HTTP request parsing, status responses, error handling
│   │   │   ├── middleware/               # Auth verification, JWT extraction, RBAC role validation
│   │   │   ├── services/
│   │   │   │   ├── dbService.js          # PostgreSQL queries, relational transactions & fallback
│   │   │   │   └── eventHub.js           # Real-time event broker & notification dispatcher
│   │   │   └── data/                     # Relational database seed datasets
│   │   ├── package.json                  # Backend dependencies
│   │   └── .env                          # Server configuration
│
└── 🧠 ALGORITHM & OPTIMIZATION LEAD (Contributor 3)
    ├── backend/src/services/scheduler/
    │   ├── CspSolver.js                  # Deterministic Backtracking CSP Solver
    │   ├── CspVariable.js                # Search variable representation (Candidate-Round-Interviewer)
    │   ├── DomainGenerator.js            # Valid time-slot & room domain pruning
    │   ├── DomainValue.js                # Value tuple representation (Time, Room, Panel)
    │   ├── ConstraintValidator.js        # Hard constraint enforcement (buffers, daily caps, room capacity)
    │   ├── SoftConstraintEvaluator.js    # Soft constraint scoring & objective optimization function
    │   ├── ScheduleOptimizer.js          # Optimal timetable search
    │   ├── DynamicRepairEngine.js        # Minimal perturbation repair for interviewer cancellations
    │   ├── IntervalUtils.js              # Half-open time interval math & overlap detection
    │   ├── TimeGridGenerator.js          # Discrete time slot generation & break buffers
    │   ├── TimezoneUtils.js              # Localized timezone conversion utilities
    │   ├── SchedulePersistenceService.js # Maps algorithmic solver results into database entities
    │   ├── index.js                      # Public engine exports
    │   └── backend/src/services/schedulerEngine.js # Bridge connecting REST API routes to CSP solver
    └── Unit & Integration Test Suites
        ├── CspSolver.test.js
        ├── ConstraintValidator.test.js
        ├── ScheduleOptimizer.test.js
        ├── DynamicRepairEngine.test.js
        ├── TimeGridGenerator.test.js
        ├── SchedulePersistenceService.test.js
        └── AutomaticRescheduling.test.js
```

---

## 🛠️ Recommended Git Collaboration Workflow

### Step 1: Branching Strategy
Each contributor should create and push their feature branch:
```bash
# Contributor 1 (Frontend Lead)
git checkout -b feature/frontend-ui

# Contributor 2 (Backend Lead)
git checkout -b feature/backend-api

# Contributor 3 (Algorithm Lead)
git checkout -b feature/csp-scheduler-engine
```

### Step 2: Commits with Proper Author Attribution
Each contributor should set their individual Git credentials on their machine:
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

If you make joint commits, add Co-Authors at the bottom of the commit message:
```git
Commit message title

Detailed description of changes.

Co-authored-by: Contributor Two <contributor2@example.com>
Co-authored-by: Contributor Three <contributor3@example.com>
```

### Step 3: Pull Requests into Main
On GitHub, open 3 Pull Requests against `main`:
1. **PR #1 (Frontend Lead)**: *"feat(ui): Complete 3-role responsive portals and authentication flows"*
2. **PR #2 (Backend Lead)**: *"feat(api): PostgreSQL relational schema, JWT auth, and REST endpoints"*
3. **PR #3 (Algorithm Lead)**: *"feat(engine): Deterministic CSP solver, soft constraint optimizer, and test suites"*

This ensures all 3 contributors appear prominently in the **GitHub Contributors Graph** and commit history!
