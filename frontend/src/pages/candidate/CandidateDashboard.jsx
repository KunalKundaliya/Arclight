import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  ExternalLink,
  CalendarCheck,
  Bell,
  Sparkles,
  BookOpen
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [candidates] = useState(() => storageService.getCandidates());
  const [interviews] = useState(() => storageService.getInterviews());

  // Soren Vance (cand-01)
  const candidate = candidates.find(c => c.id === 'cand-01') || candidates[0];
  const myInterviews = interviews.filter(i =>
    i.candidateId === candidate.id || i.candidateName.toLowerCase().includes('soren')
  );

  const nextInterview = myInterviews[0] || {
    id: 'intv-201',
    roundTitle: 'System Architecture & Fault Tolerance',
    date: '2026-10-22',
    startTime: '10:00',
    endTime: '11:00',
    duration: '60 min',
    interviewerNames: ['Dr. Evelyn Voss', 'Devon Thorne'],
    roomName: 'Virtual Cloud Chamber 1 (CodeCollab)',
    meetingUrl: 'https://meet.arclight.io/trial-crucible-201',
    status: 'Scheduled'
  };

  const stages = [
    { name: '1. Coding Challenge', status: 'Completed', score: 94 },
    { name: '2. System Architecture', status: 'Active (Scheduled)', score: 'In Progress' },
    { name: '3. Leadership & Culture', status: 'Upcoming', score: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Trial Portal"
        subtitle={`Welcome, ${candidate.name}. You are advancing through the Fall 2026 Engineering Crucible.`}
        actions={
          <Link
            to="/candidate/book/round-101"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Self-Book Next Slot</span>
          </Link>
        }
      />

      {/* Hero: Next Interview Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-navy-950 text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-mono border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Confirmed Trial Session</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              {nextInterview.roundTitle}
            </h3>

            <div className="flex flex-wrap gap-4 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                {nextInterview.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                {nextInterview.startTime} - {nextInterview.endTime} ({nextInterview.duration})
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                {nextInterview.roomName}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Panel Evaluators: <strong>{nextInterview.interviewerNames?.join(', ')}</strong>. Please test your camera and microphone in the virtual sandbox 5 minutes beforehand.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <a
              href={nextInterview.meetingUrl || 'https://meet.arclight.io/trial-crucible-201'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02]"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Virtual Chamber</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/candidate/calendar"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <span>View On My Calendar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recruitment Progress Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Recruitment Progression Tracker</h3>
            <p className="text-xs text-slate-500">Track your standing across all multi-stage crucible rounds</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Current Stage: Round 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {stages.map((stage, idx) => (
            <div
              key={stage.name}
              className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                idx === 0
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : idx === 1
                  ? 'bg-indigo-50/60 border-indigo-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Stage 0{idx + 1}
                  </span>
                  {idx === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                    </span>
                  ) : idx === 1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                      <Clock className="w-3.5 h-3.5" /> Scheduled
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">Upcoming</span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{stage.name}</h4>
                <div className="text-slate-600">
                  {idx === 0 ? 'Concluded with distinction.' : idx === 1 ? 'Slot confirmed for Oct 22.' : 'Opens upon Round 2 completion.'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500">Benchmark:</span>
                <span className="font-bold text-slate-800">
                  {idx === 0 ? `${stage.score} pts` : stage.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Upcoming Sessions & Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">All Scheduled Sessions</h3>
            <Link to="/candidate/interviews" className="text-xs font-semibold text-indigo-600 hover:underline">
              View History
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {myInterviews.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{item.roundTitle}</div>
                  <div className="text-slate-500">{item.date} • {item.startTime} - {item.endTime}</div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">{item.roomName}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Candidate Directives */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Candidate FAQ & Rules</h4>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>All sessions use the integrated WebRTC Code Sandbox. No local environment installation required.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Rescheduling is allowed up to 12 hours prior to start.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Evaluations are posted to your portal within 24 hours.</span>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              to="/candidate/progress"
              className="block text-center w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Track Stage Progression
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
