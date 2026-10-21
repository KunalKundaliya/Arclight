"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Stepper from "@/components/Stepper";
import { csvColumns, fieldOptions, validationRows } from "@/lib/drives";

export default function ImportCandidates() {
  const [fileName, setFileName] = useState("northstar_candidates_2026.csv");
  const [map, setMap] = useState(Object.fromEntries(csvColumns.map((c) => [c.csv, c.field])));
  const [skip, setSkip] = useState(true);
  const [update, setUpdate] = useState(false);

  const required = ["Full name *", "Email *", "Student ID *"];
  const missing = required.filter((r) => !Object.values(map).includes(r));

  return (
    <div className="space-y-6">
      <PageHeader crumb="WEBSTER 2026 / PLACEMENT DRIVES" title="A clean list. A better schedule."
        subtitle="Northstar Labs · Map your columns and resolve issues before adding candidates.">
        <button className="btn-ghost">CSV template</button>
      </PageHeader>
      <Stepper current={2} />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <section className="card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-xs text-slate-500">244 rows · 84 KB · Uploaded just now</p>
            </div>
            <label className="btn-ghost cursor-pointer">Replace file
              <input type="file" accept=".csv" className="sr-only"
                onChange={(e) => e.target.files[0] && setFileName(e.target.files[0].name)} />
            </label>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">Map your columns</h2>
            <p className="text-xs text-slate-500">Required fields are matched. You can change a mapping below.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr><th className="p-2">CSV column</th><th>Sample value</th><th>ArcLight field</th><th>Validation</th></tr>
                </thead>
                <tbody>
                  {csvColumns.map((c) => (
                    <tr key={c.csv} className="border-b">
                      <td className="p-3 font-medium">{c.csv}</td>
                      <td className="text-slate-500">{c.sample}</td>
                      <td>
                        <select aria-label={`Field for ${c.csv}`} value={map[c.csv]}
                          onChange={(e) => setMap({ ...map, [c.csv]: e.target.value })}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs">
                          {fieldOptions.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className={map[c.csv] === "Ignore column" ? "text-slate-400" : "text-emerald-600"}>
                        {map[c.csv] === "Ignore column" ? "Ignored" : "Matched"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <div>
              <p className="font-semibold text-amber-900">240 valid candidates · 4 rows excluded</p>
              <p className="text-xs text-amber-800">Two duplicate IDs and two invalid email addresses won’t be imported.</p>
            </div>
            <button className="text-xs font-medium text-amber-900">Download errors</button>
          </div>

          <section className="card p-5">
            <div className="flex justify-between">
              <h2 className="font-semibold">Validation details</h2>
              <button className="text-sm font-medium text-brand">Show all rows</button>
            </div>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr><th className="p-2">CSV row</th><th>Candidate</th><th>Issue</th><th>Action</th></tr>
              </thead>
              <tbody>
                {validationRows.map((v) => (
                  <tr key={v.row} className="border-b">
                    <td className="p-3">{v.row}</td><td>{v.candidate}</td>
                    <td className="text-red-600">{v.issue}</td><td className="text-slate-500">{v.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">Also excluded: row 121 (duplicate ID), row 208 (invalid email).</p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="font-semibold">Ready for import</h2>
            <p className="mt-4 text-4xl font-semibold">240</p>
            <p className="text-xs text-slate-500">valid, unique candidates</p>
            {missing.length === 0
              ? <span className="mt-3 inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Required fields mapped</span>
              : <p role="alert" className="mt-3 text-xs text-red-600">Map these fields to continue: {missing.join(", ")}</p>}
            <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
              <span>Skip 4 invalid rows<br /><span className="text-xs text-slate-500">No partial or duplicate records are added.</span></span></label>
            <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={update} onChange={(e) => setUpdate(e.target.checked)} />
              <span>Update existing candidates<br /><span className="text-xs text-slate-500">Match on student ID; preserve evaluations.</span></span></label>
          </section>
          <section className="card p-5">
            <h2 className="font-semibold">Safe to retry</h2>
            <p className="mt-2 text-xs text-slate-500">Importing this file again won’t create duplicates. Candidate records are matched by student ID and normalized email within this drive.</p>
          </section>
        </aside>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/coordinator/drives/new" className="btn-ghost">Back</Link>
        <button disabled={missing.length > 0} className="btn-primary disabled:opacity-50">Import 240 & continue to schedule →</button>
      </div>
    </div>
  );
}
