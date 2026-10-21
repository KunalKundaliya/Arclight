import React from 'react';
import { GitBranch, CheckCircle2, Clock, Award, Star } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

export default function CandidateProgressPage() {
  const progressSteps = [
    {
      round: 'Round 1: Coding Challenge',
      status: 'Passed',
      score: 94,
      date: 'Oct 18, 2026',
      notes: 'Solved dynamic programming problem in 22 minutes with optimal time complexity.',
      rubricPassed: true
    },
    {
      round: 'Round 2: System Architecture & Fault Tolerance',
      status: 'Active (Slot Confirmed)',
      score: 'In Progress',
      date: 'Oct 22, 2026 (10:00 AM)',
      notes: 'Evaluating consensus protocols, network splits, and Raft replication buffers.',
      rubricPassed: null
    },
    {
      round: 'Round 3: Executive Bar Raiser & Cultural Fit',
      status: 'Upcoming',
      score: 'Pending',
      date: 'Projected: Late Oct 2026',
      notes: 'Evaluates team scaling, ownership principles, and technical leadership impact.',
      rubricPassed: null
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Pipeline Progression"
        subtitle="Live status tracker across all stages of the Fall 2026 Engineering Crucible"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Progress' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Multi-Stage Crucible Roadmap</h3>
            <p className="text-xs text-slate-500">Track milestones and evaluation benchmarks</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
            Stage 2 of 3 Active
          </span>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
          {progressSteps.map((step, idx) => (
            <div key={step.round} className="relative flex items-start gap-5 text-xs">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 shadow-xs ${
                step.status === 'Passed'
                  ? 'bg-emerald-600 text-white'
                  : step.status.includes('Active')
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step.status === 'Passed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>

              <div className={`flex-1 p-5 rounded-2xl border ${
                step.status.includes('Active')
                  ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                  : step.status === 'Passed'
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">{step.round}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] w-fit ${
                    step.status === 'Passed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : step.status.includes('Active')
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step.status}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed mb-3">{step.notes}</p>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Timeline: {step.date}</span>
                  <span className="font-bold text-slate-800">Score: {step.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
