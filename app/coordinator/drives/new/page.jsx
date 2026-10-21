"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Stepper from "@/components/Stepper";
import { initialRounds } from "@/lib/drives";

const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export default function CreateDrive() {
  const router = useRouter();
  const [f, setF] = useState({
    partner: "Northstar Labs", role: "Software Engineer · Graduate", name: "Northstar Labs · Engineering",
    window: "Nov 2 – Nov 6, 2026", tz: "Asia/Kolkata (UTC+05:30)", selfBook: true, approval: true,
  });
  const [rounds, setRounds] = useState(initialRounds);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const addRound = () => setRounds([...rounds, { name: `R${rounds.length + 1} · New round`, duration: "30 min", panel: "Unassigned", dependsOn: `Pass R${rounds.length}` }]);

  return (
    <div className="space-y-6">
      <PageHeader crumb="WEBSTER 2026 / PLACEMENT DRIVES" title="Create a placement drive"
        subtitle="Start with the essentials. You can fine-tune constraints before scheduling.">
        <button className="btn-ghost">Save draft</button>
      </PageHeader>
      <Stepper current={1} />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="font-semibold">Drive essentials</h2>
            <p className="text-xs text-slate-500">Fields marked * are required.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-slate-500">Hiring partner *<input className={input} value={f.partner} onChange={set("partner")} /></label>
              <label className="text-xs text-slate-500">Role *<input className={input} value={f.role} onChange={set("role")} /></label>
              <label className="text-xs text-slate-500 sm:col-span-2">Drive name *<input className={input} value={f.name} onChange={set("name")} /></label>
              <label className="text-xs text-slate-500">Interview window *<input className={input} value={f.window} onChange={set("window")} /></label>
              <label className="text-xs text-slate-500">Time zone<input className={input} value={f.tz} onChange={set("tz")} /></label>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">Interview rounds</h2>
                <p className="text-xs text-slate-500">Round order is enforced as a hard scheduling constraint.</p>
              </div>
              <button onClick={addRound} className="text-sm font-medium text-brand">+ Add round</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr><th className="p-2">Round</th><th>Duration</th><th>Panel / skills</th><th>Depends on</th></tr>
                </thead>
                <tbody>
                  {rounds.map((r) => (
                    <tr key={r.name} className="border-b">
                      <td className="p-3 font-medium">{r.name}</td><td className="text-slate-500">{r.duration}</td>
                      <td className="text-slate-500">{r.panel}</td><td className="text-slate-500">{r.dependsOn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">Participation & booking</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm">
              <label className="flex gap-2"><input type="checkbox" checked={f.selfBook} onChange={set("selfBook")} />
                <span><b className="font-medium">Allow candidate self-booking</b><br /><span className="text-xs text-slate-500">Only eligible, conflict-free slots are offered.</span></span></label>
              <label className="flex gap-2"><input type="checkbox" checked={f.approval} onChange={set("approval")} />
                <span><b className="font-medium">Require approval for rescheduling</b><br /><span className="text-xs text-slate-500">Keep published interviews stable.</span></span></label>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="font-semibold">Your drive, at a glance</h2>
            <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Draft</span>
            <p className="mt-3 text-lg font-semibold">{f.name || "Untitled drive"}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">{f.window}<br />{rounds.length} rounds<br />Coordinator · Maya Chen</p>
            <p className="mt-3 text-xs text-slate-500">Next: import your candidate list, map fields and validate records.</p>
          </section>
          <section className="card p-5">
            <h2 className="font-semibold">A dependable starting point</h2>
            <p className="mt-2 text-xs text-slate-500">All dates and notifications use the drive time zone. Participants can view their own local time without shifting the interview.</p>
          </section>
        </aside>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/coordinator/drives" className="btn-ghost">Cancel</Link>
        <button onClick={() => router.push("/coordinator/drives/import")} className="btn-primary">Continue to CSV import →</button>
      </div>
    </div>
  );
}
