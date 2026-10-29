import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Video, User, CheckCircle2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { apiClient } from '../../services/apiClient';
import { useRealtime } from '../../context/RealtimeContext';
import { normalizeDate } from '../coordinator/MasterCalendarPage';
import { Link } from 'react-router-dom';

export default function InterviewerCalendarPage() {
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

  const myInterviews = interviews.filter(i => {
    const ids = Array.isArray(i.interviewerIds) ? i.interviewerIds : [i.interviewerIds || ''];
    const names = Array.isArray(i.interviewerNames) ? i.interviewerNames : [i.interviewerNames || ''];
    return ids.includes('int-01') || names.some(n => String(n).toLowerCase().includes('voss') || String(n).toLowerCase().includes('priya'));
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Interview Calendar"
        subtitle="Schedule of all assigned candidate evaluations and live coding assessments"
        breadcrumbs={[
          { label: 'Interviewer', to: '/interviewer' },
          { label: 'My Calendar' }
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

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Assigned Calendar Sessions</h3>
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
                  <span>{normalizeDate(session.date)} • {session.startTime} - {session.endTime}</span>
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

          {myInterviews.length === 0 && (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No sessions currently assigned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
