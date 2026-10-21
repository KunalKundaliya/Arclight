"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const roles = ["coordinator", "interviewer", "candidate"];

export default function Login() {
  const [role, setRole] = useState("coordinator");
  const [error, setError] = useState("");
  const router = useRouter();

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    if (!f.get("email") || !f.get("password")) return setError("Enter your email and password to sign in.");
    router.push(`/${role}`); // TODO: call POST /auth/login and store the JWT
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to ArcLight</h1>
        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          {roles.map((r) => (
            <button type="button" key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
              className={`rounded-md py-1.5 capitalize ${role === r ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>{r}</button>
          ))}
        </div>
        <label className="block text-sm">Email
          <input name="email" type="email" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="block text-sm">Password
          <input name="password" type="password" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full">Sign in</button>
      </form>
    </main>
  );
}
