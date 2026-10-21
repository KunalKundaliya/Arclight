import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFD] text-slate-800 selection:bg-indigo-600 selection:text-white font-sans">
      {/* Top Navigation Bar matching Screenshot 1 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white font-bold text-base shadow-sm">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">ArcLight</span>
          </Link>

          {/* Center Navigation Links - only prompt-specified items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#preview" className="hover:text-slate-900 transition-colors">Live Preview</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg shadow-sm transition-all hover:translate-y-[-0.5px]"
            >
              Get Started
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
