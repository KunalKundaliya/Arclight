import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Video, User, CheckCircle2, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';

export default function CandidateInterviewDetailPage() {
  const { id } = useParams();
  const interviews = storageService.getInterviews();
  const session = interviews.find(i => i.id === id) || interviews[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/candidate/interviews" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to My Interviews
        </Link>
      </div>

      <PageHeader
        title={`Session: ${session.roundTitle}`}
        subtitle={`Scheduled for ${session.date} from ${session.startTime} to ${session.endTime}`}
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Interviews', to: '/candidate/interviews' },
          { label: session.roundTitle }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Confirmed Assessment</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{session.roundTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={session.roundType} type="round" />
            <StatusBadge status={session.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date & Time</span>
            <div className="font-bold text-slate-800 text-base mt-1">{session.date}</div>
            <div className="text-indigo-600 font-mono mt-0.5">{session.startTime} - {session.endTime} ({session.duration})</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Room Location</span>
            <div className="font-bold text-slate-800 text-base mt-1">{session.roomName}</div>
            <div className="text-slate-500 mt-0.5">Automated AI Code Sandbox Active</div>
          </div>
        </div>

        {/* Meeting room link */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white">Live Virtual Meeting Room</h4>
            <p className="text-xs text-slate-400 mt-1">Please test audio and screen-sharing prior to session start</p>
          </div>
          <a
            href={session.meetingUrl || 'https://meet.arclight.io/apex-interview-201'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            <Video className="w-4 h-4" />
            <span>Join Interview Meeting</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
