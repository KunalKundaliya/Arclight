import React, { useState } from 'react';
import {
  ClipboardCheck,
  Star,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  BarChart2,
  FileText
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import { storageService } from '../../services/storageService';
import { candidateRankings } from '../../data/mockEvaluations';

export default function EvaluationsPage() {
  const [evaluations] = useState(() => storageService.getEvaluations());
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  const columns = [
    {
      header: 'Candidate & Role',
      key: 'candidateName',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 cursor-pointer hover:text-indigo-600" onClick={() => setSelectedEvaluation(row)}>
            {row.candidateName}
          </div>
          <div className="text-[11px] text-slate-400">{row.role}</div>
        </div>
      )
    },
    {
      header: 'Round',
      key: 'round',
      render: (round) => (
        <span className="font-medium text-slate-700">{round}</span>
      )
    },
    {
      header: 'Interviewer',
      key: 'interviewerName',
      render: (name) => <span className="font-medium text-slate-800">{name}</span>
    },
    {
      header: 'Status & Recommendation',
      key: 'status',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status === 'Completed' ? 'Passed' : row.status === 'Draft' ? 'In Review' : 'Awaiting Evaluation'} />
          <span className="text-xs font-semibold text-slate-700">{row.recommendation}</span>
        </div>
      )
    },
    {
      header: 'Total Score',
      key: 'totalScore',
      render: (score) => (
        score ? (
          <div className="flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 w-fit">
            <Star className="w-3 h-3 fill-indigo-500 text-indigo-500" />
            <span>{score} / 100</span>
          </div>
        ) : (
          <span className="text-slate-400 font-mono text-xs">Pending Score</span>
        )
      )
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (_, row) => (
        <button
          onClick={() => setSelectedEvaluation(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Rubric</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Evaluations & Scorecards"
        subtitle="Standardized multi-vector grading rubrics, peer reviews, and cumulative talent ranking leaderboard"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Evaluations' }
        ]}
      />

      {/* Main Evaluations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Standardized Interview Scorecards</h3>
            <p className="text-xs text-slate-500">Evaluator assessments recorded for recent interview rounds</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            Demonstrative Data
          </span>
        </div>

        <DataTable columns={columns} data={evaluations} />
      </div>

      {/* Candidate Ranking Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Cumulative Candidate Leaderboard</h3>
          </div>
          <span className="text-xs font-medium text-slate-400">Weighted Cross-Stage Composite Scores</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 font-semibold uppercase text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Track</th>
                <th className="py-2.5 px-3">Rounds Passed</th>
                <th className="py-2.5 px-3">Composite Score</th>
                <th className="py-2.5 px-3">Recruiting Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidateRankings.map((cand) => (
                <tr key={cand.rank} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                      cand.rank === 1 ? 'bg-amber-100 text-amber-800' : cand.rank === 2 ? 'bg-slate-200 text-slate-800' : cand.rank === 3 ? 'bg-amber-50 text-amber-700' : 'text-slate-500'
                    }`}>
                      #{cand.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{cand.name}</td>
                  <td className="py-3 px-3">{cand.role}</td>
                  <td className="py-3 px-3 font-mono">{cand.roundsPassed} / 3 Rounds</td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {cand.score} pts
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                      cand.status.includes('Offer') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : cand.status.includes('Active') ? 'bg-blue-50 text-blue-700' : cand.status.includes('Rejected') ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {cand.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED RUBRIC MODAL */}
      <Modal
        isOpen={Boolean(selectedEvaluation)}
        onClose={() => setSelectedEvaluation(null)}
        title={selectedEvaluation?.candidateName || 'Evaluation Rubric'}
        subtitle={`${selectedEvaluation?.round} • Evaluator: ${selectedEvaluation?.interviewerName}`}
      >
        {selectedEvaluation && (
          <div className="space-y-4 text-xs text-slate-600">
            {/* Rubric Score Breakdown Bars */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 block text-xs">Standardized Rubric Scores (1.0 — 5.0)</span>
              
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Technical Knowledge & Depth</span>
                  <span className="font-mono">{selectedEvaluation.rubric?.technicalKnowledge || '—'} / 5.0</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(selectedEvaluation.rubric?.technicalKnowledge / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Problem Solving & Algorithmic Rigor</span>
                  <span className="font-mono">{selectedEvaluation.rubric?.problemSolving || '—'} / 5.0</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${(selectedEvaluation.rubric?.problemSolving / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>System Architecture / Code Quality</span>
                  <span className="font-mono">{selectedEvaluation.rubric?.codeQuality || '—'} / 5.0</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: `${(selectedEvaluation.rubric?.codeQuality / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Communication & Culture Fit</span>
                  <span className="font-mono">{selectedEvaluation.rubric?.communication || '—'} / 5.0</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(selectedEvaluation.rubric?.communication / 5) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Strengths & Growth Areas */}
            {selectedEvaluation.strengths && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                <span className="font-bold block mb-1">Key Strengths Demonstrated</span>
                <p className="leading-relaxed">{selectedEvaluation.strengths}</p>
              </div>
            )}

            {selectedEvaluation.growthAreas && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950">
                <span className="font-bold block mb-1">Identified Growth Areas</span>
                <p className="leading-relaxed">{selectedEvaluation.growthAreas}</p>
              </div>
            )}

            {selectedEvaluation.summary && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span className="font-bold block mb-1 text-slate-900">Evaluator Synthesis</span>
                <p className="leading-relaxed">{selectedEvaluation.summary}</p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="font-semibold text-indigo-900">Official Recommendation:</span>
              <span className="font-bold text-sm text-indigo-700">{selectedEvaluation.recommendation}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
