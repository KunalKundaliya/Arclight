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
    <div className="relative pt-12 sm:pt-16 pb-28 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-24 sm:space-y-32">
      {/* 1. TOP HERO SECTION matching Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Headline Column */}
        <div className="lg:col-span-7 space-y-7">
          {/* Badge Pill matching Screenshot */}
          <div className="inline-block">
            <Link
              to="/coordinator"
              className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-medium text-[#6366f1] bg-[#eef2ff]/80 hover:bg-[#eef2ff] border border-[#e0e7ff] rounded-full transition-colors group cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>
              <span>A calmer kind of placement season</span>
              <span className="group-hover:translate-x-0.5 transition-transform text-slate-400">→</span>
            </Link>
          </div>

          {/* Large Bold Headline with Plus Jakarta Sans */}
          <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-extrabold tracking-[-0.035em] text-slate-900 leading-[1.08]">
            Great placements.<br />
            <span className="text-[#6366f1]">Less calendar chaos.</span>
          </h1>

          {/* Subtitle with spacious line height */}
          <p className="text-lg sm:text-[19px] text-slate-500 font-normal leading-[1.65] max-w-xl">
            Smart scheduling for the people doing the work. Bring interviews, candidates, and your calendar together — so everyone gets to focus on what matters.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              to="/coordinator"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:translate-y-[-1px]"
            >
              <span>Explore the workspace</span>
              <span>→</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-colors shadow-2xs"
            >
              Sign in to Arclight
            </Link>
          </div>

          {/* Social Proof Avatar Stack matching Reference */}
          <div className="flex items-center gap-3.5 pt-3">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold border-2 border-white shadow-2xs">
                MC
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border-2 border-white shadow-2xs">
                PN
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border-2 border-white shadow-2xs">
                AP
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border-2 border-white shadow-2xs">
                +8
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                Made for the people behind every placement.
              </div>
              <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                Thoughtful coordination starts here.
              </div>
            </div>
          </div>
        </div>

        {/* Right Feature Highlights Column matching Reference */}
        <div className="lg:col-span-5 lg:pl-4 space-y-7 pt-4">
          {/* Feature 1: Goodbye calendar Tetris */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50/90 text-[#6366f1] flex items-center justify-center shrink-0 border border-indigo-100/60 shadow-2xs">
              <Calendar className="w-5 h-5 text-[#6366f1]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Goodbye calendar Tetris.</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Find the schedule that works for everyone.
              </p>
            </div>
          </div>

          {/* Feature 2: Everyone knows what's next */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50/90 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-2xs">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Everyone knows what's next.</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A clear path for candidates, interviewers, and you.
              </p>
            </div>
          </div>

          {/* Feature 3: Built around real people */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50/90 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60 shadow-2xs">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Built around real people.</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Smart defaults, with room for human judgment.
              </p>
            </div>
          </div>

          {/* Micro text at bottom right */}
          <p className="text-xs text-slate-400 font-normal pt-2">
            Thoughtfully designed for placement teams
          </p>
        </div>
      </div>

      {/* 2. VISUAL PRODUCT PREVIEW CARD matching Reference Image exactly */}
      <div id="preview" className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* macOS Window Title Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/60 border-b border-slate-100">
          {/* 3 window dots */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
          </div>

          {/* Centered title */}
          <div className="text-[11px] font-mono font-medium tracking-[0.2em] text-slate-400 uppercase">
            ARCLIGHT · PLACEMENT WEEK
          </div>

          {/* Right action */}
          <Link
            to="/coordinator/calendar"
            className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-1 transition-colors"
          >
            <span>Open workspace</span>
            <span className="text-xs">↗</span>
          </Link>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Subheader with title and avatar chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                YOUR PLACEMENT WEEK
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                A schedule with room to breathe.
              </h2>
            </div>

            {/* Right Avatars */}
            <div className="flex items-center -space-x-1.5 self-start sm:self-auto">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-[#4f46e5] text-[10px] font-bold border-2 border-white">
                PM
              </span>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border-2 border-white">
                RM
              </span>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border-2 border-white">
                AP
              </span>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border-2 border-white">
                +4
              </span>
            </div>
          </div>

          {/* Schedule Calendar Grid matching Reference */}
          <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
            {/* Day Header Row */}
            <div className="grid grid-cols-6 bg-slate-50/50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 text-center">
              <div className="py-2.5 px-3 border-r border-slate-200/80 flex items-center justify-center text-slate-400">
                <span className="cursor-pointer hover:text-slate-700">‹</span>
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200/80 font-bold text-[#4f46e5] bg-[#eef2ff]/30">
                MON 02
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200/80 text-slate-600">
                TUE 03
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200/80 text-slate-600">
                WED 04
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200/80 text-slate-600">
                THU 05
              </div>
              <div className="py-2.5 px-3 text-slate-600">
                FRI 06
              </div>
            </div>

            {/* Row 1: 09:00 */}
            <div className="grid grid-cols-6 min-h-[92px] border-b border-slate-100">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200/80 bg-slate-50/20">
                09:00
              </div>

              {/* MON 02: Ananya Shah */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">09:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Ananya Shah</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Priya Nair · Coding</div>
                </div>
              </div>

              {/* TUE 03: Empty */}
              <div className="p-2 border-r border-slate-100" />

              {/* WED 04: Dev Joshi */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">09:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Dev Joshi</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rohan Mehta · Technical</div>
                </div>
              </div>

              {/* THU 05: Empty */}
              <div className="p-2 border-r border-slate-100" />

              {/* FRI 06: Rohan Mehta */}
              <div className="p-2">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">09:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Rohan Mehta</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Anika Patel · HR</div>
                </div>
              </div>
            </div>

            {/* Row 2: 10:00 */}
            <div className="grid grid-cols-6 min-h-[92px] border-b border-slate-100">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200/80 bg-slate-50/20">
                10:00
              </div>

              {/* MON 02: Empty */}
              <div className="p-2 border-r border-slate-100" />

              {/* TUE 03: Neha Kapoor */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">10:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Neha Kapoor</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rohan Mehta · Coding</div>
                </div>
              </div>

              {/* WED 04: Rahul Patel */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#fef3c7]/60 border border-[#fde68a] text-left">
                  <div className="text-[10px] font-mono text-amber-700 font-medium">10:00 - 45 min</div>
                  <div className="font-bold text-xs text-amber-950 mt-0.5">Rahul Patel</div>
                  <div className="text-[10px] text-amber-800 mt-0.5">Priya Nair · Technical</div>
                </div>
              </div>

              {/* THU 05: Zoya Ali */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#dcfce7]/60 border border-[#bbf7d0] text-left">
                  <div className="text-[10px] font-mono text-emerald-700 font-medium">10:00 - 45 min</div>
                  <div className="font-bold text-xs text-emerald-950 mt-0.5">Zoya Ali</div>
                  <div className="text-[10px] text-emerald-800 mt-0.5">Mira Chen · HR</div>
                </div>
              </div>

              {/* FRI 06: Empty */}
              <div className="p-2" />
            </div>

            {/* Row 3: 11:00 */}
            <div className="grid grid-cols-6 min-h-[92px] border-b border-slate-100">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200/80 bg-slate-50/20">
                11:00
              </div>

              {/* MON 02: Sohan Mehta */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">11:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Sohan Mehta</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Priya Nair · Coding</div>
                </div>
              </div>

              {/* TUE 03: Ishan Rao */}
              <div className="p-2 border-r border-slate-100">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">11:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Ishan Rao</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Priya Nair · HR</div>
                </div>
              </div>

              {/* WED 04: Empty */}
              <div className="p-2 border-r border-slate-100" />

              {/* THU 05: Empty */}
              <div className="p-2 border-r border-slate-100" />

              {/* FRI 06: Ananya Shah */}
              <div className="p-2">
                <div className="p-2 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left">
                  <div className="text-[10px] font-mono text-[#6366f1] font-medium">11:00 - 45 min</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">Ananya Shah</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rohan Mehta · Technical</div>
                </div>
              </div>
            </div>

            {/* Row 4: 12:00 Lunch Break matching Reference */}
            <div className="grid grid-cols-6 min-h-[48px] bg-slate-50/30">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200/80 bg-slate-50/20">
                12:00
              </div>
              <div className="py-3 text-center text-[11px] text-slate-400 italic border-r border-slate-100">Lunch break</div>
              <div className="py-3 text-center text-[11px] text-slate-400 italic border-r border-slate-100">Lunch break</div>
              <div className="py-3 text-center text-[11px] text-slate-400 italic border-r border-slate-100">Lunch break</div>
              <div className="py-3 text-center text-[11px] text-slate-400 italic border-r border-slate-100">Lunch break</div>
              <div className="py-3 text-center text-[11px] text-slate-400 italic">Lunch break</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE FEATURE CARDS */}
      <div id="features" className="space-y-12 pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-block">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] bg-[#eef2ff] px-3.5 py-1 rounded-full border border-[#e0e7ff]">
              CORE PLATFORM CAPABILITIES
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for high-stakes recruitment drives
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            Purpose-built tools to solve multi-panel conflicts, high-volume applicant routing, and interview coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: Automated Scheduling */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card hover:border-indigo-200 transition-all space-y-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6366f1] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated Scheduling</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Intelligent scheduling engine assigns candidates to interviewer panels and rooms based on availability, daily caps, and skill sets.
            </p>
          </div>

          {/* Feature 2: Conflict Detection */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card hover:border-indigo-200 transition-all space-y-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Conflict Detection</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Instant alerts pinpoint interviewer schedule overlaps, double-booked rooms, capacity shortages, and applicant unavailability before publication.
            </p>
          </div>

          {/* Feature 3: Candidate Self-Booking */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card hover:border-indigo-200 transition-all space-y-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Candidate Self-Booking</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Empower applicants to choose verified conflict-free interview slots with instant calendar synchronization, meeting links, and preparation guidelines.
            </p>
          </div>

          {/* Feature 4: Calendar Management */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card hover:border-indigo-200 transition-all space-y-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Calendar Management</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Unified multi-day schedule with day, week, and month views. Filter sessions dynamically by interview round, faculty member, or assigned room.
            </p>
          </div>

          {/* Feature 5: Recruitment Pipeline Tracking */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card hover:border-indigo-200 transition-all space-y-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pipeline Progression Tracking</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Track candidate progression across multi-stage funnels from initial coding screens through architecture reviews to final executive offer rounds.
            </p>
          </div>

          {/* Feature 6: Standardized Evaluations */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card hover:border-indigo-200 transition-all space-y-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Standardized Scorecards</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Consistent 4-metric scoring rubrics for interviewers ensure objective hiring decisions with structured technical feedback and recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* 4. THREE-STEP WORKFLOW SECTION */}
      <div id="how-it-works" className="space-y-12 pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-block">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] bg-[#eef2ff] px-3.5 py-1 rounded-full border border-[#e0e7ff]">
              WORKFLOW
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Arclight Works
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            A modern three-step system to replace endless spreadsheet coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Set Rules & Panels</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Configure recruitment drives, interviewer availability, maximum daily interviews, room capacities, and buffer intervals.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-[#6366f1] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-500/30">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Intelligent Automated Scheduling</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              The automated engine evaluates candidate-interviewer pairings to generate zero-overlap schedules and highlight bottlenecks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Book & Evaluate Confidently</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Candidates confirm slots via self-service, interviewers submit rubric evaluations, and coordinators track placement week in real time.
            </p>
          </div>
        </div>
      </div>

      {/* 5. FINAL CTA SECTION */}
      <div id="resources" className="rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white p-10 sm:p-16 text-center space-y-8 shadow-xl">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
          Ready to eliminate calendar chaos in recruitment?
        </h2>
        <p className="text-base sm:text-lg text-indigo-200/90 max-w-xl mx-auto font-normal leading-relaxed">
          Experience intelligent conflict-free scheduling built for enterprise hiring and university placement drives.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/coordinator"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:translate-y-[-1px]"
          >
            <span>Explore the workspace</span>
            <span>→</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
          >
            Sign in to Arclight
          </Link>
        </div>
      </div>
    </div>
  );
}
