// Mock data for the Placement drives pages. Replace with API calls later.
export const driveStats = [
  { label: "Active drives", value: "4", note: "Webster · Class of 2026", tone: "text-emerald-600" },
  { label: "Registered candidates", value: "512", note: "Across all active drives", tone: "text-emerald-600" },
  { label: "Hiring partners", value: "4", note: "Engineering, finance & design", tone: "text-emerald-600" },
  { label: "Offers recorded", value: "38", note: "From completed drives", tone: "text-emerald-600" },
];

// group: active | draft | completed
export const drives = [
  { name: "Northstar Labs", role: "Software Engineer", rounds: 3, window: "Nov 2–6, 2026", candidates: "240", owner: "Maya Chen", status: "Published · v2", tone: "text-emerald-600", action: "Open", group: "active" },
  { name: "Meridian Finance", role: "Graduate Analyst", rounds: 2, window: "Nov 9–10, 2026", candidates: "96", owner: "Maya Chen", status: "Collecting", tone: "text-brand", action: "Open", group: "active" },
  { name: "Forma Studio", role: "Product Designer", rounds: 3, window: "Nov 12–13, 2026", candidates: "64", owner: "Daniel Park", status: "Ready to schedule", tone: "text-brand", action: "Schedule", group: "active" },
  { name: "Helix Systems", role: "Data Engineer", rounds: 3, window: "Nov 16–18, 2026", candidates: "112", owner: "Maya Chen", status: "Collecting", tone: "text-brand", action: "Open", group: "active" },
  { name: "Northstar Labs · Winter cohort", role: "Software Engineer", rounds: 3, window: "Dec 7–11, 2026", candidates: "—", owner: "Maya Chen", status: "Draft", tone: "text-slate-500", action: "Continue", group: "draft", href: "/coordinator/drives/new" },
];

export const initialRounds = [
  { name: "R1 · Technical screen", duration: "45 min", panel: "1 interviewer · React, DSA", dependsOn: "None" },
  { name: "R2 · System design", duration: "45 min", panel: "Panel A · Systems", dependsOn: "Pass R1" },
  { name: "R3 · Hiring conversation", duration: "30 min", panel: "Daniel Park · Hiring", dependsOn: "Pass R2" },
];

export const csvColumns = [
  { csv: "full_name", sample: "Aanya Shah", field: "Full name *" },
  { csv: "email_address", sample: "aanya.shah@webster.edu", field: "Email *" },
  { csv: "student_id", sample: "W26-041", field: "Student ID *" },
  { csv: "skills", sample: "React; DSA; TypeScript", field: "Skills" },
];
export const fieldOptions = ["Full name *", "Email *", "Student ID *", "Skills", "Ignore column"];

export const validationRows = [
  { row: 17, candidate: "Aanya Shah", issue: "Duplicate student ID W26-041", action: "Exclude" },
  { row: 63, candidate: "Tara Sethi", issue: "Invalid email · tara@", action: "Fix in CSV" },
];
