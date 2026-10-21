import Sidebar from "@/components/Sidebar";

export default function CoordinatorLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <input aria-label="Search" placeholder="Search people, drives, interviews…"
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <span className="ml-4 whitespace-nowrap text-xs text-slate-400">Demo data</span>
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </div>
    </div>
  );
}
