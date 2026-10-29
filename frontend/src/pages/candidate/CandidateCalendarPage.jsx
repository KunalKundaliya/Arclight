import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Video, CheckCircle2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { apiClient } from '../../services/apiClient';
import { useRealtime } from '../../context/RealtimeContext';
import CalendarExportButtons from '../../components/common/CalendarExportButtons';
import { normalizeDate } from '../coordinator/MasterCalendarPage';

export default function CandidateCalendarPage() {
  const [interviews, setInterviews] = useState(() => storageService.getInterviews());
  const [isLoading, setIsLoading] = useState(false);
  const { lastUpdated } = useRealtime();

  const fetchLiveInterviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getInterviews().catch(() => null);
      if (res?.data) {
        setInterviews(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveInterviews();
  }, [fetchLiveInterviews]);

  useEffect(() => {
    fetchLiveInterviews();
  }, [lastUpdated, fetchLiveInterviews]);

  const myInterviews = interviews.filter(i =>
    i.candidateId === 'cand-01' || (i.candidateName || '').toLowerCase().includes('soren')
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Interview Calendar"
        subtitle="Schedule of upcoming technical and leadership interview rounds"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Calendar' }
        ]}
        actions={
          <button
            onClick={fetchLiveInterviews}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Your Confirmed Interview Dates</h3>
          </div>
          <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
            {myInterviews.length} Confirmed Slots
          </span>
        </div>

        <div className="space-y-3">
          {myInterviews.map((session) => {
            const facultyNames = Array.isArray(session.interviewerNames) && session.interviewerNames.length > 0
              ? session.interviewerNames.join(', ')
              : (session.interviewerNames || 'Assigned Faculty');

            return (
              <div
                key={session.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={session.roundType} type="round" />
                    <StatusBadge status={session.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{session.roundTitle}</h4>
                  <div className="text-slate-500 font-mono mt-0.5">Faculty: {facultyNames}</div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">Location: {session.roomName}</div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono">
                    <div className="font-bold text-indigo-900">{normalizeDate(session.date)}</div>
                    <div>{session.startTime} - {session.endTime} ({session.duration})</div>
                  </div>
                  <CalendarExportButtons interview={session} />
                </div>
              </div>
            );
          })}

          {myInterviews.length === 0 && (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No interview sessions scheduled yet. Head over to the Self-Booking Portal to select your slot.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
