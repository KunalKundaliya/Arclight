import React, { useState } from 'react';
import { Calendar, Clock, Video, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';

export default function CandidateCalendarPage() {
  const [interviews] = useState(() => storageService.getInterviews());
  const myInterviews = interviews.filter(i =>
    i.candidateId === 'cand-01' || i.candidateName.toLowerCase().includes('soren')
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Trial Calendar"
        subtitle="Schedule of upcoming technical and leadership interview rounds"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Calendar' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Your Confirmed Trial Dates</h3>
          </div>
          <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
            {myInterviews.length} Confirmed Slots
          </span>
        </div>

        <div className="space-y-3">
          {myInterviews.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={session.roundType} type="round" />
                  <StatusBadge status={session.status} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{session.roundTitle}</h4>
                <div className="text-slate-500 font-mono mt-0.5">Faculty: {session.interviewerNames.join(', ')}</div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono">
                <div className="font-bold text-indigo-900">{session.date}</div>
                <div>{session.startTime} - {session.endTime} ({session.duration})</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
