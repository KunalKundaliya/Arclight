import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, User, CheckCircle2, ExternalLink, ArrowRight, CalendarCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

export default function CandidateInterviewsPage() {
  const { user } = useAuth();
  const [interviews] = useState(() => storageService.getInterviews());

  const isDemoCandidate = !user || user.email === 'aanya.shah@webster.edu' || user.id === 'cand-01' || user.name === 'Aanya Shah';

  const myInterviews = interviews.filter(i => {
    if (isDemoCandidate) {
      return i.candidateId === 'cand-01' || (i.candidateName || '').toLowerCase().includes('aanya') || (i.candidateName || '').toLowerCase().includes('soren');
    }
    const idMatch = user?.id && i.candidateId === user.id;
    const nameMatch = user?.name && (i.candidateName || '').toLowerCase() === user.name.toLowerCase();
    const emailMatch = user?.email && (i.candidateEmail || '').toLowerCase() === user.email.toLowerCase();
    return idMatch || nameMatch || emailMatch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Interviews"
        subtitle="Historical and upcoming interview rounds for the Fall 2026 Webster Placement Drive"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Interviews' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
        {myInterviews.map((session) => (
          <div
            key={session.id}
            className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={session.roundType} type="round" />
                <StatusBadge status={session.status} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">{session.roundTitle}</h4>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                Evaluators: {Array.isArray(session.interviewerNames) ? session.interviewerNames.join(', ') : session.interviewerNames}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-xs text-indigo-900 space-y-1 min-w-[200px]">
              <div>{session.date}</div>
              <div>{session.startTime} - {session.endTime} ({session.duration})</div>
              <div className="text-slate-400 text-[10px] truncate">{session.roomName}</div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/candidate/interviews/${session.id}`}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                Session Details
              </Link>
              <a
                href={session.meetingUrl || 'https://meet.arclight.io/apex-interview-201'}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1"
              >
                <span>Meeting Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}

        {myInterviews.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No interview sessions found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              You haven't scheduled any interviews yet. You can self-book a verified slot right now.
            </p>
            <div className="pt-2">
              <Link
                to="/candidate/book/round-101"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Book a Slot Now</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
