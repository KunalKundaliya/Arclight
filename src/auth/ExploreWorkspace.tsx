import { ArrowLeft, ArrowRight, CalendarDays, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Role } from "./api";

const roles: {
  role: Role;
  title: string;
  description: string;
  features: string[];
  icon: typeof Users;
  tone: string;
}[] = [
  {
    role: "candidate",
    title: "Candidate",
    description: "Find opportunities, manage interviews, and keep your next steps in view.",
    features: ["Eligible placement drives", "Interview timeline", "Calendar-ready bookings"],
    icon: GraduationCap,
    tone: "candidate",
  },
  {
    role: "recruiter",
    title: "HR / Recruiter",
    description: "Coordinate hiring drives, review candidates, and move decisions forward.",
    features: ["Candidate shortlists", "Interview rounds", "Hiring progress"],
    icon: Users,
    tone: "recruiter",
  },
  {
    role: "coordinator",
    title: "Coordinator",
    description: "Keep placement schedules, people, and interview logistics aligned.",
    features: ["Placement calendar", "Constraint-based scheduling", "Conflict resolution"],
    icon: CalendarDays,
    tone: "coordinator",
  },
];

export function ExploreWorkspace({
  onBack,
  onChoose,
}: {
  onBack: () => void;
  onChoose: (role: Role) => void;
}) {
  return (
    <main className="explore-page">
      <button className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Back to Arclight</button>
      <div className="explore-intro">
        <span className="auth-eyebrow"><ShieldCheck size={14} /> ONE WORKSPACE, THE RIGHT ACCESS</span>
        <h1>How do you work with Arclight?</h1>
        <p>Choose your role to see the tools and workspace built for you.</p>
      </div>
      <div className="role-cards">
        {roles.map(({ role, title, description, features, icon: Icon, tone }) => (
          <article className="role-card" key={role}>
            <span className={`role-icon role-icon-${tone}`}><Icon size={20} /></span>
            <h2>{title}</h2>
            <p>{description}</p>
            <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <button className="button button-primary role-action" onClick={() => onChoose(role)}>
              Sign in as {title} <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>
      <p className="explore-footnote">Recruiter and coordinator access is invitation-only. Your account role is verified by Arclight.</p>
    </main>
  );
}
