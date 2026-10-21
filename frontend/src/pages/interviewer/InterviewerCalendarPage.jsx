import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Video, User, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { Link } from 'react-router-dom';

export default function InterviewerCalendarPage() {
  const [interviews] = useState(() => storageService.getInterviews());
  const myInterviews = interviews.filter(i =>
    (i.interviewerIds || []).includes('int-01') || (i.interviewerNames || []).some(n => n.includes('Voss'))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Interview Calendar"
        subtitle="Schedule of all assigned candidate evaluations and live coding assessments"
        breadcrumbs={[
          { label: 'Interviewer', to: '/interviewer' },
          { label: 'My Calendar' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Assigned Calendar Sessions (Dr. Evelyn Voss)</h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            {myInterviews.length} Scheduled Sessions
          </span>
        </div>

        <div className="space-y-4">
          {myInterviews.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={session.roundType} type="round" />
                  <StatusBadge status={session.status} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{session.candidateName} — {session.candidateRole}</h4>
                <div className="text-slate-500">{session.roundTitle}</div>
                <div className="text-slate-400 font-mono mt-1">ID: {session.id}</div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 space-y-1 min-w-[220px]">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{session.date} • {session.startTime} - {session.endTime}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{session.roomName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/interviewer/interviews/${session.id}`}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  View Directives
                </Link>
                <Link
                  to="/interviewer/evaluations/eval-303"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Fill Scorecard
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
