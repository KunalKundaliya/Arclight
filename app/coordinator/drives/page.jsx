"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { driveStats, drives } from "@/lib/drives";

const count = (g) => drives.filter((d) => d.group === g).length;
const tabs = [
  ["all", "All drives"],
  ["active", `Active · ${count("active")}`],
  ["draft", `Drafts · ${count("draft")}`],
  ["completed", "Completed"],
];

export default function DrivesPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const rows = drives.filter(
    (d) => (tab === "all" || d.group === tab) && `${d.name} ${d.role}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader crumb="WEBSTER 2026 / PLACEMENT DRIVES" title="Placement drives"
        subtitle="Every hiring partner, candidate cohort and schedule in one place.">
        <Link href="/coordinator/drives/new" className="btn-primary">Create drive +</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {driveStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            {tabs.map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1.5 ${tab === key ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input aria-label="Search drives" placeholder="Search drives…" value={q} onChange={(e) => setQ(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button className="btn-ghost">Filters</button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr><th className="py-2">Drive / hiring role</th><th>Interview window</th><th>Candidates</th><th>Owner</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.name} className="border-t">
                  <td className="py-3"><p className="font-medium text-slate-900">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.role} · {d.rounds} rounds</p></td>
                  <td className="text-slate-500">{d.window}</td>
                  <td className="text-slate-500">{d.candidates}</td>
                  <td className="text-slate-500">{d.owner}</td>
                  <td className={d.tone}>{d.status}</td>
                  <td><Link href={d.href || "#"} className="text-slate-600 hover:text-brand">{d.action} →</Link></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No drives match. Clear the search or switch tabs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">Showing {rows.length} drives</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">Start from a proven structure</h2>
          <p className="text-xs text-slate-500">Engineering · 3 rounds · 45-minute interviews</p>
          <p className="mt-3 text-sm text-slate-600">Reuse a drive template with room rules, panel skills and round dependencies already in place.</p>
          <Link href="/coordinator/drives/new" className="mt-4 inline-block text-sm font-medium text-brand">Use engineering template →</Link>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">No archived drives yet</h2>
          <p className="text-xs text-slate-500">Your completed placement history lives here.</p>
          <p className="mt-3 text-sm text-slate-600">Archive a completed drive to keep its schedules, evaluations and audit history together.</p>
        </section>
      </div>
    </div>
  );
}
