import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  User,
  ArrowRight,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';

export default function InterviewDetailPage() {
  const { id } = useParams();
  const interviews = storageService.getInterviews();
  const session = interviews.find(i => i.id === id) || interviews[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/interviewer" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Terminal
        </Link>
      </div>

      <PageHeader
        title={`Interview Session: ${session.candidateName}`}
        subtitle={`${session.roundTitle} • Scheduled for ${session.date} (${session.startTime} - ${session.endTime})`}
        actions={
          <Link
            to="/interviewer/evaluations/eval-303"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Open Rubric Scorecard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main overview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                  {session.candidateName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{session.candidateName}</h3>
                  <div className="text-xs text-slate-500">{session.candidateRole}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={session.roundType} type="round" />
                <StatusBadge status={session.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scheduled Window</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{session.date}</div>
                <div className="text-indigo-600 font-mono mt-0.5">{session.startTime} - {session.endTime} ({session.duration})</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Chamber</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{session.roomName}</div>
                <div className="text-slate-500 mt-0.5">High-Speed Fiber & Collaborative Code IDE</div>
              </div>
            </div>

            {/* Launch Chamber Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <h4 className="font-bold text-sm text-white">Virtual Trial Room Ready</h4>
                <p className="text-xs text-indigo-200 mt-0.5">Automated transcription and real-time code sandbox initialized</p>
              </div>
              <a
                href={session.meetingUrl || 'https://meet.arclight.io/trial-crucible-201'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-xs"
              >
                <Video className="w-4 h-4" />
                <span>Enter Live Video Chamber</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Directives */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Technical Directives for this Round</h4>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {session.notes || 'Evaluate candidate on high-throughput message replication, byzantine fault tolerance, and memory layout tradeoffs.'}
            </div>
          </div>
        </div>

        {/* Co-Interviewers & Quick Link */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Evaluation Panel Faculty</h4>
            <div className="space-y-2.5 text-xs text-slate-700">
              {session.interviewerNames.map((name) => (
                <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">{name}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                to="/interviewer/evaluations/eval-303"
                className="block text-center w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Open Evaluation Form
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
