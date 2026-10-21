import Link from "next/link";
import WeekGrid from "@/components/WeekGrid";

const steps = [
  ["Build your drive", "Set rounds, durations, panels and rooms, then import candidates from a CSV."],
  ["Find the best fit", "ArcLight weighs skills, availability and workload to build a clash-free timetable."],
  ["Review. Publish. Relax.", "Check the draft, resolve flagged issues, and publish for candidates to book."],
];
const roles = [
  ["Coordinators", "See the whole placement week, conflicts and coverage in one workspace."],
  ["Interviewers", "Share availability and skills, then focus on the conversation and your scores."],
  ["Candidates", "Pick a valid slot for your round, get an invite, and know your next step."],
];
const faqs = [
  ["Is AI making the final decision?", "No. The solver proposes a timetable and you review and publish it."],
  ["How does Google Calendar fit?", "Confirmed interviews download as .ics files or sync to Google Calendar."],
  ["Can each role see their own workspace?", "Yes. Coordinators, interviewers and candidates each get their own portal."],
];

export default function Landing() {
  return (
    <div className="bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <span className="text-lg font-semibold">ArcLight</span>
        <nav className="hidden gap-6 text-sm text-slate-600 md:flex">
          <a href="#platform">Platform</a><a href="#how">How it works</a><a href="#roles">For your campus</a><a href="#faq">Resources</a>
        </nav>
        <div className="flex gap-2">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/coordinator" className="btn-primary">Explore the demo</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-slate-900">Great placements. Less calendar chaos.</h1>
        <p className="mt-4 max-w-xl text-slate-600">Smarter scheduling, fewer conflicts, better placement experiences.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/coordinator" className="btn-primary">Explore coordinator demo</Link>
          <a href="#how" className="btn-ghost">See how it works</a>
        </div>
        <div className="card mt-10 p-4 shadow-sm"><WeekGrid /></div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-semibold">Complex logistics. A remarkably clear workflow.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map(([t, d]) => (
            <div key={t} className="card bg-slate-50 p-5"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
      </section>

      <section id="platform" className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2">
        <div className="rounded-2xl bg-navy p-6 text-slate-200">
          <h3 className="text-2xl font-semibold text-white">Not just a slot. The right slot.</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Availability matched to every panel</li><li>Skills and panels respected</li>
            <li>Rooms and durations checked</li><li>Waiting time kept low</li>
          </ul>
        </div>
        <div>
          <h3 className="text-2xl font-semibold">Know why it works. Know what changes.</h3>
          <p className="mt-3 text-slate-600">When an interviewer drops out, ArcLight moves only the interviews that must change and notifies only those candidates.</p>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-semibold">One platform. Three clearer perspectives.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roles.map(([t, d]) => (
            <div key={t} className="card p-5"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-semibold">Clarity before you start.</h2>
        {faqs.map(([q, a]) => (
          <details key={q} className="border-b py-3"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-slate-600">{a}</p></details>
        ))}
      </section>

      <section className="bg-navy px-4 py-16 text-center text-white">
        <h2 className="text-3xl font-semibold">Make room for what comes next.</h2>
        <p className="mt-2 text-slate-300">Less coordinating. More meaningful placement moments.</p>
        <Link href="/coordinator" className="btn-primary mt-6">Explore the demo</Link>
      </section>
      <footer className="p-6 text-center text-xs text-slate-500">© 2026 ArcLight · Webster 2026</footer>
    </div>
  );
}
