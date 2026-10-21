import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Cpu,
  AlertTriangle,
  Layers,
  Clock,
  Users,
  CheckCircle2,
  CalendarCheck,
  GitBranch
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20">
      {/* 1. TOP HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Headline Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge Pill matching Screenshot 1 */}
          <div className="inline-block">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#4f46e5] bg-[#eef2ff] rounded-md border border-[#e0e7ff]">
              BUILT FOR WEBSTER 2026
            </span>
          </div>

          {/* Large Bold Headline matching Screenshot 1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Great placements.<br />
            Less calendar chaos.
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-500 font-normal leading-relaxed max-w-xl">
            Smarter scheduling. Fewer conflicts. Better placement experiences.
          </p>

          {/* Prompt-specified CTAs: Primary = Get Started, Secondary = Explore Dashboard */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:translate-y-[-1px]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/coordinator"
              className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
            >
              Explore Dashboard
            </Link>
          </div>

          {/* Microcopy disclaimer */}
          <p className="text-xs text-slate-400 font-normal pt-2">
            A visual product concept. Simulated AI solving and mocked calendar integration.
          </p>
        </div>

        {/* Right Feature Highlights Column matching Screenshot 1 */}
        <div className="lg:col-span-5 lg:pl-6 space-y-6 pt-4">
          <p className="text-sm font-medium text-slate-500 leading-snug">
            One thoughtful workspace for every person behind a placement.
          </p>

          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-[#4f46e5] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Constraint-aware planning</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Balance people, panels, rooms and rounds.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-[#4f46e5] shrink-0 mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">A clear path to confirmed</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Book confidently, then keep everyone in sync.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-[#4f46e5] shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Human control, always</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Review every change before you publish.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VISUAL PRODUCT PREVIEW CARD matching Screenshot 1 */}
      <div id="preview" className="rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-7">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-bold text-base shadow-xs">
              N
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900">Northstar Labs · Engineering</h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100">
                  228 interviews scheduled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">November 2–6, 2026 · Webster campus</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="sm:hidden inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100">
              228 interviews scheduled
            </span>
            {/* Open Calendar: distinct destination to /coordinator/calendar */}
            <Link
              to="/coordinator/calendar"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg shadow-xs transition-colors"
            >
              Open Calendar
            </Link>
          </div>
        </div>

        {/* Schedule Grid & AI Preview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          {/* Calendar Grid (9 cols) */}
          <div className="lg:col-span-9 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Header Columns */}
            <div className="grid grid-cols-6 bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700 text-center">
              <div className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-400">
                IST
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#4f46e5] bg-[#eef2ff]/40">
                MON 02
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                TUE 03
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                WED 04
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                THU 05
              </div>
              <div className="py-2.5 px-3 text-slate-600">
                FRI 06
              </div>
            </div>

            {/* Time Slot Row: 09:00 */}
            <div className="grid grid-cols-6 min-h-[96px] border-b border-slate-100">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200 bg-slate-50/20">
                09:00
              </div>

              {/* MON 02 Cell: Aanya Shah */}
              <div className="p-1.5 border-r border-slate-100 bg-[#f8f9ff]/50">
                <div className="p-2.5 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#4f46e5]">09:00–09:45</div>
                  <div className="font-bold text-xs text-[#312e81] mt-0.5">Aanya Shah</div>
                  <div className="text-[10px] text-[#4338ca] mt-0.5">R1 · Priya · C-201</div>
                </div>
              </div>

              {/* TUE 03 Cell: Empty */}
              <div className="p-1.5 border-r border-slate-100" />

              {/* WED 04 Cell: Dev Joshi */}
              <div className="p-1.5 border-r border-slate-100">
                <div className="p-2.5 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#4f46e5]">09:00–09:45</div>
                  <div className="font-bold text-xs text-[#312e81] mt-0.5">Dev Joshi</div>
                  <div className="text-[10px] text-[#4338ca] mt-0.5">R1 · Priya · C-201</div>
                </div>
              </div>

              {/* THU 05 Cell: Empty */}
              <div className="p-1.5 border-r border-slate-100" />

              {/* FRI 06 Cell: Rohan Mehta */}
              <div className="p-1.5">
                <div className="p-2.5 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#4f46e5]">09:00–09:30</div>
                  <div className="font-bold text-xs text-[#312e81] mt-0.5">Rohan Mehta</div>
                  <div className="text-[10px] text-[#4338ca] mt-0.5">R1 · Devon · C-203</div>
                </div>
              </div>
            </div>

            {/* Time Slot Row: 10:00 */}
            <div className="grid grid-cols-6 min-h-[96px]">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200 bg-slate-50/20">
                10:00
              </div>

              {/* MON 02 */}
              <div className="p-1.5 border-r border-slate-100" />

              {/* TUE 03: Neha Kapoor */}
              <div className="p-1.5 border-r border-slate-100">
                <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100 text-left">
                  <div className="text-[10px] font-mono text-cyan-700">10:00–10:45</div>
                  <div className="font-bold text-xs text-cyan-950 mt-0.5">Neha Kapoor</div>
                  <div className="text-[10px] text-cyan-700 mt-0.5">R1 · Aria · C-202</div>
                </div>
              </div>

              {/* WED 04: Conflict Warning */}
              <div className="p-1.5 border-r border-slate-100">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-left">
                  <div className="text-[10px] font-mono text-amber-700">10:00–10:45</div>
                  <div className="font-bold text-xs text-amber-950 mt-0.5">Conflict · Panel A</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Overlap Alert</div>
                </div>
              </div>

              {/* THU 05: Mira Patel */}
              <div className="p-1.5 border-r border-slate-100">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-left">
                  <div className="text-[10px] font-mono text-emerald-700">10:00–10:45</div>
                  <div className="font-bold text-xs text-emerald-950 mt-0.5">Mira Patel</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">R1 · Priya · C-201</div>
                </div>
              </div>

              {/* FRI 06 */}
              <div className="p-1.5" />
            </div>
          </div>

          {/* Right Mini Card: Simulated AI Preview (3 cols) */}
          <div className="lg:col-span-3 rounded-xl bg-[#f8fafc] border border-slate-200/90 p-5 flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4f46e5] bg-[#eef2ff] rounded-md border border-[#e0e7ff] inline-block mb-4">
                SIMULATED AI PREVIEW
              </span>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                A better fit.<br />
                For everyone.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                228 interviews distributed across 8 panels and 6 rooms with 0 panel double-bookings.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200/60">
              {/* Distinct destination to /coordinator/scheduler */}
              <Link
                to="/coordinator/scheduler"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#4f46e5] bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
              >
                <span>Launch CSP solver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROMPT-SPECIFIED 5 CORE FEATURE CARDS */}
      <div id="features" className="space-y-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#4f46e5] bg-[#eef2ff] px-2.5 py-1 rounded-md border border-[#e0e7ff]">
            CORE PLATFORM CAPABILITIES
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for constraint-satisfaction recruitment
          </h2>
          <p className="text-sm text-slate-500">
            Purpose-built tools to solve multi-panel conflicts, high-volume applicant routing, and interview coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Automated Scheduling */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4f46e5] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Scheduling</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deterministic constraint-satisfaction engine assigns candidates to interviewer panels and rooms based on availability, daily caps, and skill sets.
            </p>
          </div>

          {/* Feature 2: Conflict Detection */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Conflict Detection</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant alerts pinpoint interviewer schedule overlaps, double-booked chambers, capacity shortages, and applicant unavailability before publication.
            </p>
          </div>

          {/* Feature 3: Candidate Self-Booking */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Candidate Self-Booking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Empower applicants to choose verified conflict-free interview slots with instant calendar synchronization, meeting links, and preparation directives.
            </p>
          </div>

          {/* Feature 4: Calendar Management */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Calendar Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unified multi-day schedule with day, week, and month views. Filter sessions dynamically by interview round, faculty member, or assigned room.
            </p>
          </div>

          {/* Feature 5: Recruitment Pipeline Tracking */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Pipeline Progression Tracking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track candidate progression across multi-stage funnels from initial coding screens through architecture reviews to final executive offer rounds.
            </p>
          </div>

          {/* Feature 6: Standardized Evaluations */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Standardized Scorecards</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consistent 4-metric scoring rubrics for interviewers ensure objective hiring decisions with structured technical feedback and recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* 4. PROMPT-SPECIFIED THREE-STEP HOW IT WORKS SECTION */}
      <div id="how-it-works" className="space-y-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#4f46e5] bg-[#eef2ff] px-2.5 py-1 rounded-md border border-[#e0e7ff]">
            WORKFLOW
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Ancient One’s Trials Works
          </h2>
          <p className="text-sm text-slate-500">
            A three-step deterministic system to replace endless spreadsheet coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-4 relative">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Define Constraints & Panels</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure recruitment drives, interviewer availability, maximum daily interviews, room capacities, and buffer intervals.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-4 relative">
            <div className="w-8 h-8 rounded-lg bg-[#4f46e5] text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Intelligent CSP Solving</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The automated solver evaluates millions of candidate-interviewer pairings to generate zero-overlap schedules and highlight bottlenecks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-4 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Book & Evaluate Confidently</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Candidates confirm slots via self-service, interviewers submit rubric evaluations, and coordinators track placement week in real time.
            </p>
          </div>
        </div>
      </div>

      {/* 5. PROMPT-SPECIFIED FINAL CTA SECTION */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
          Ready to eliminate calendar chaos in recruitment?
        </h2>
        <p className="text-sm sm:text-base text-indigo-200 max-w-xl mx-auto font-normal">
          Experience automated constraint-satisfaction scheduling built for university placements and high-volume recruiting drives.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-xl shadow-md transition-all hover:translate-y-[-1px]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/coordinator"
            className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
          >
            Explore Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
