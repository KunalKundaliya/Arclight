// Replace with real FastAPI calls later (keep the same shapes).
export const stats = [
  { label: "Active placement drives", value: "4", note: "2 opening this week", tone: "text-emerald-600" },
  { label: "Candidates in Northstar", value: "240", note: "228 scheduled · 95% coverage", tone: "text-emerald-600" },
  { label: "Interviews this week", value: "228", note: "Across 8 panels · 6 rooms", tone: "text-slate-500" },
  { label: "Needs your attention", value: "3", note: "2 conflicts · 1 dropout request", tone: "text-amber-600" },
];

export const days = ["MON 02", "TUE 03", "WED 04", "THU 05", "FRI 06"];

// d = day index, h = start hour, c = color key
export const events = [
  { d: 0, h: 9, name: "Aanya Shah", sub: "R1 · Priya · C-201", c: "violet" },
  { d: 0, h: 11, name: "Rohan Mehta", sub: "R1 · Alex · C-201", c: "sky" },
  { d: 1, h: 10, name: "Neha Kapoor", sub: "R1 · Alex · C-202", c: "sky" },
  { d: 1, h: 11, name: "Ishaan Rao", sub: "R1 · Priya · C-201", c: "violet" },
  { d: 2, h: 9, name: "Dev Joshi", sub: "R1 · Priya · C-201", c: "violet" },
  { d: 2, h: 10, name: "Conflict · Panel A", sub: "Priya unavailable", c: "amber" },
  { d: 2, h: 13, name: "Zoya Ali", sub: "R2 · Panel B · C-203", c: "emerald" },
  { d: 3, h: 10, name: "Mira Patel", sub: "R2 · Panel A · C-203", c: "emerald" },
  { d: 4, h: 9, name: "Rohan Mehta", sub: "R1 · Alex · C-201", c: "violet" },
];

export const drives = [
  { name: "Northstar Labs · Engineering", window: "Nov 2–6, 2026", candidates: 240, coverage: "228 / 240 scheduled", status: "Published · v2" },
  { name: "Meridian Finance · Analyst", window: "Nov 9–10, 2026", candidates: 96, coverage: "Awaiting availability", status: "Collecting" },
];

export const nav = [
  ["Overview", ""], ["Placement drives", "drives"], ["Calendar", "calendar"], ["AI scheduler", "scheduler"],
  ["Conflicts", "conflicts"], ["Evaluations", "evaluations"], ["Rankings", "rankings"], ["Analytics", "analytics"],
  ["Notifications", "notifications"], ["Settings", "settings"], ["My profile", "profile"],
];
