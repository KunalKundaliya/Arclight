# ArcLight

**Great placements. Less calendar chaos.**

A placement-drive interview scheduler. It collects interviewer availability and skills, generates a clash-free timetable with a constraint solver, lets candidates book only valid slots, and reschedules with minimal disruption when an interviewer drops out.

## Website Pages

| Page | Path | Status |
|------|------|--------|
| Landing | `/` | Built |
| Login (role tabs) | `/login` | Built, mock |
| Coordinator overview | `/coordinator` | Built, mock |
| Placement drives | `/coordinator/drives` | Built, mock |
| Create drive | `/coordinator/drives/new` | Built, mock |
| Import candidates | `/coordinator/drives/import` | Built, mock |
| Interviewer portal | `/interviewer` | Placeholder |
| Candidate portal | `/candidate` | Placeholder |
| Other coordinator pages (Calendar, Conflicts, Evaluations, Rankings, Analytics, Notifications, Settings, Profile) | `/coordinator/[section]` | Placeholder |

## Folder Structure

```
arclight/
├── app/
│   ├── page.jsx                  # Landing
│   ├── login/                    # Login
│   ├── [portal]/                 # Interviewer, Candidate
│   └── coordinator/
│       ├── layout.jsx            # Sidebar + top bar
│       ├── page.jsx              # Overview
│       ├── [section]/            # Unbuilt pages
│       └── drives/               # List, new, import
├── components/                   # Sidebar, StatCard, WeekGrid, PageHeader, Stepper
├── lib/                          # Mock data (mock.js, drives.js)
└── package.json
```

## Run Locally

Requires Node.js 18.17+.

```bash
cd arclight
npm install
npm run dev
```

Open http://localhost:3000. On the login page, pick a role and enter any email and password.

For production: `npm run build && npm run start`

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS, FullCalendar
- **Planned backend:** FastAPI, OR-Tools CP-SAT, PostgreSQL, Redis, Celery

## Key Features

- Three portals: Candidate, Interviewer, Coordinator
- Clash-free scheduling with OR-Tools CP-SAT
- Candidate self-booking with valid slots only
- Minimal-disruption rescheduling
- Multi-round pipeline (Coding → Technical → HR)
- `.ics` downloads and notifications

## Connect to Backend

1. Add `NEXT_PUBLIC_API_URL=http://localhost:8000` to `.env.local`
2. Create `lib/api.js`, a fetch wrapper that sends the JWT
3. Replace mock imports with API calls, one page at a time
4. Enable CORS for `http://localhost:3000` on the backend

## Troubleshooting

- **`'next' is not recognized`:** run `npm install` in the folder containing `package.json`.
- **Page shows 404:** check the file is named `page.jsx`, delete `.next`, and restart `npm run dev`.
- **`@/components` import errors:** `components` and `lib` must sit next to `app`.

## Roadmap

- [ ] Schedule and Review & publish steps
- [ ] Interviewer portal
- [ ] Candidate portal and booking
- [ ] Remaining coordinator pages
- [ ] Connect to FastAPI backend