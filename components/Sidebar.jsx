"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/lib/mock";

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-navy p-4 text-slate-300 md:flex">
      <Link href="/" className="px-2 text-lg font-semibold text-white">ArcLight</Link>
      <p className="px-2 pb-6 text-xs text-slate-400">Coordinator workspace</p>
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(([label, slug]) => {
          const href = slug ? `/coordinator/${slug}` : "/coordinator";
             const active = slug ? path.startsWith(href) : path === href;
          return (
            <Link key={label} href={href}
              className={`rounded-lg px-3 py-2 text-sm ${active ? "bg-brand text-white" : "hover:bg-white/10"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-2 pt-4 text-sm">
        <p className="text-white">Maya Chen</p>
        <p className="text-xs text-slate-400">Coordinator · ArcLight</p>
      </div>
    </aside>
  );
}
