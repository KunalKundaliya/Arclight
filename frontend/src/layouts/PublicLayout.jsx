import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFD] text-slate-800 selection:bg-indigo-600 selection:text-white font-sans">
      {/* Top Navigation Bar matching Reference */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo with 3 slanted lines icon */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 flex items-center justify-center text-[#6366f1]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                <line x1="6" y1="19" x2="10" y2="5" />
                <line x1="12" y1="19" x2="16" y2="5" />
                <line x1="18" y1="19" x2="22" y2="5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Arclight</span>
          </Link>

          {/* Center Navigation Links matching reference */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#resources" className="hover:text-slate-900 transition-colors">Resources</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg"
              title="Toggle theme"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-2 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/coordinator"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl shadow-xs transition-all hover:translate-y-[-0.5px]"
            >
              <span>Explore workspace</span>
              <span className="text-base leading-none">→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#4f46e5] text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="font-bold text-slate-800">ArcLight</span>
            <span>· Built for Webster 2026 Campus Recruitment</span>
          </div>
          <div>
            A visual product concept. Simulated AI solving and mocked calendar integration.
          </div>
        </div>
      </footer>
    </div>
  );
}
