import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ClipboardCheck,
  UserCheck,
  Video,
  ArrowRight,
  ExternalLink,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

export default function InterviewerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interviews] = useState(() => storageService.getInterviews());
  const [evaluations] = useState(() => storageService.getEvaluations());

  // Filter interviews assigned to Dr. Evelyn Voss ('int-01')
  const myInterviews = interviews.filter(i =>
    (i.interviewerIds || []).includes('int-01') || (i.interviewerNames || []).some(n => n.includes('Voss'))
  );

  const pendingEvaluations = myInterviews.filter(i => i.evaluationStatus === 'Pending' || i.evaluationStatus === 'Draft');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviewer Dashboard"
        subtitle={`Welcome, Dr. Evelyn Voss. You have ${myInterviews.length} active sessions assigned in the Fall 2026 Webster Placement Drive.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/interviewer/availability"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Update Availability</span>
            </Link>
            <Link
              to="/interviewer/calendar"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Full Calendar</span>
            </Link>
          </div>
        }
      />

      {/* Pending Evaluation Banner if any */}
      {pendingEvaluations.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Scorecard Action Required ({pendingEvaluations.length} Pending)
              </h4>
              <p className="text-amber-800 mt-0.5">
                Elena Rostova's Executive Leadership session completed. Please submit your standardized rubric assessment.
              </p>
            </div>
          </div>
          <Link
            to="/interviewer/evaluations/eval-303"
            className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>Complete Rubric</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assigned Sessions"
          value={myInterviews.length}
          change="3 this week"
          changeType="positive"
          icon={Calendar}
          iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
          description="Within daily capacity cap (3/day)"
        />
        <StatCard
          title="Pending Rubric Evals"
          value={pendingEvaluations.length}
          change={pendingEvaluations.length > 0 ? "Action required" : "All cleared"}
          changeType={pendingEvaluations.length > 0 ? "negative" : "positive"}
          icon={ClipboardCheck}
          iconColor="text-amber-600 bg-amber-50 border-amber-100"
          description="Average submission time: 4 hrs"
        />
        <StatCard
          title="Weekly Availability"
          value="Mon, Wed, Fri"
          change="10:00 - 16:00"
          changeType="neutral"
          icon={Clock}
          iconColor="text-blue-600 bg-blue-50 border-blue-100"
          description="12 open hours remaining"
          onClick={() => navigate('/interviewer/availability')}
        />
        <StatCard
          title="Evaluator Quality Rating"
          value="4.9 / 5.0"
          change="Top 5%"
          changeType="positive"
          icon={Star}
          iconColor="text-amber-600 bg-amber-50 border-amber-100"
          description="Candidate experience benchmark"
        />
      </div>

      {/* Main Content: Assigned Interviews List & Quick Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interviews list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Assigned Interview Sessions</h3>
              <p className="text-xs text-slate-500">Upcoming live coding assessments and system architecture panels</p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {myInterviews.length} assigned
            </span>
          </div>

          <div className="space-y-3">
            {myInterviews.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{session.candidateName}</div>
                    <div className="text-slate-500 text-xs font-medium">{session.candidateRole}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={session.roundType} type="round" />
                    <StatusBadge status={session.status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session.date} • {session.startTime} - {session.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{session.roomName}</span>
                  </div>
                  <div className="flex items-center justify-start sm:justify-end gap-2">
                    <Link
                      to={`/interviewer/interviews/${session.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to={`/interviewer/evaluations/eval-303`}
                      className="px-2.5 py-1 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                    >
                      Evaluate
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Assessment Guidelines & Faculty Profile */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Technical Assessment Guidelines</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Verify candidate's grasp of zero-copy replication buffers in Coding round.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Focus on partition splits and byzantine consensus trade-offs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Submit standard rubric scorecard within 4 hours of session end.</span>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/interviewer/profile"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>View My Faculty Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
