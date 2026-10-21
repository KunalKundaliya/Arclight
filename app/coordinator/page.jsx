import StatCard from "@/components/StatCard";
import WeekGrid from "@/components/WeekGrid";
import { stats, drives } from "@/lib/mock";

export default function Overview() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">A clearer view of placement week.</h1>
          <p className="text-sm text-slate-500">Good morning, Maya. Here’s what needs your attention.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">Export report</button>
          <button className="btn-primary">Create drive +</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p><b className="text-amber-900">Three scheduling issues, one place to resolve them.</b>{" "}
          <span className="text-amber-800">Two availability conflicts and one dropout request need review.</span></p>
        <a href="/coordinator/conflicts" className="font-medium text-amber-900">Review issues</a>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Your placement week</h2>
          <WeekGrid />
        </section>
        <aside className="card h-fit p-4">
          <h2 className="font-semibold">Up next</h2>
          <p className="mt-3 font-medium">Aanya Shah</p>
          <p className="text-sm text-slate-500">Technical screen · R1 · C-201</p>
          <p className="text-sm text-slate-500">09:00–09:45 IST</p>
          <button className="btn-ghost mt-4 w-full">Interview details</button>
        </aside>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Active drives</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr><th className="py-2">Drive</th><th>Window</th><th>Candidates</th><th>Coverage</th><th>Status</th></tr>
            </thead>
            <tbody>
              {drives.map((d) => (
                <tr key={d.name} className="border-t">
                  <td className="py-3 font-medium">{d.name}</td><td>{d.window}</td>
                  <td>{d.candidates}</td><td>{d.coverage}</td><td className="text-emerald-600">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
