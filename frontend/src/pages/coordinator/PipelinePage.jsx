import React, { useState } from 'react';
import {
  GitBranch,
  ArrowRight,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Award
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function PipelinePage() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState(() => storageService.getCandidates());
  const [drives] = useState(() => storageService.getDrives());
  
  const [selectedDriveId, setSelectedDriveId] = useState('drv-101');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Define the stages
  const stages = [
    {
      id: 'Coding',
      name: '1. Coding Crucible',
      badge: 'bg-cyan-500',
      description: 'Algorithmic efficiency, time complexity, and low-level concurrency'
    },
    {
      id: 'Technical',
      name: '2. Technical Architecture',
      badge: 'bg-indigo-500',
      description: 'Distributed consensus, fault tolerance, and system decomposition'
    },
    {
      id: 'HR',
      name: '3. Executive Bar Raiser',
      badge: 'bg-violet-500',
      description: 'Leadership principles, culture alignment, and cross-functional communication'
    }
  ];

  // Candidates filtered by drive
  const filteredCandidates = candidates.filter(
    c => selectedDriveId === 'all' || c.driveId === selectedDriveId
  );

  // Promote candidate to next round
  const handlePromote = (candId) => {
    const updated = candidates.map(c => {
      if (c.id === candId) {
        if (c.stage === 'Coding') {
          return { ...c, stage: 'Technical', currentRound: 'System Architecture', status: 'Scheduled' };
        } else if (c.stage === 'Technical') {
          return { ...c, stage: 'HR', currentRound: 'Leadership & Fit', status: 'Scheduled' };
        } else {
          return { ...c, status: 'Passed' };
        }
      }
      return c;
    });

    storageService.saveCandidate(updated.find(c => c.id === candId));
    setCandidates(updated);
    setSelectedCandidate(null);
    showToast('Candidate successfully promoted to the next trial round!', 'success');
  };

  // Mark status update
  const handleSetStatus = (candId, newStatus) => {
    const updated = candidates.map(c => {
      if (c.id === candId) {
        return { ...c, status: newStatus };
      }
      return c;
    });

    storageService.saveCandidate(updated.find(c => c.id === candId));
    setCandidates(updated);
    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatus });
    }
    showToast(`Candidate status changed to ${newStatus}`, 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Stage Recruitment Pipeline"
        subtitle="Visual progression board tracking candidates through Coding, System Architecture, and Executive Bar Raiser stages"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Recruitment Pipeline' }
        ]}
      />

      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Filter by Recruitment Drive:</label>
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="all">All Recruitment Drives</option>
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Total Candidates in Board: {filteredCandidates.length}
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stages.map((stage) => {
          const stageCandidates = filteredCandidates.filter(
            c => (c.stage || 'Technical') === stage.id
          );

          return (
            <div
              key={stage.id}
              className="bg-slate-100/70 rounded-2xl border border-slate-200/80 p-4 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${stage.badge}`} />
                  <h3 className="font-bold text-sm text-slate-900">{stage.name}</h3>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {stageCandidates.length}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mb-3 px-1">{stage.description}</p>

              {/* Candidates Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {stageCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-indigo-300 transition-all cursor-pointer text-xs group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${candidate.avatarBg || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                          {candidate.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {candidate.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                            {candidate.email}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={candidate.status} />
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium mb-2.5 line-clamp-1">
                      {candidate.appliedRole}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(candidate.skills || []).slice(0, 3).map(skill => (
                        <span key={skill} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-50 text-slate-600 border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Bottom metrics */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Score: <strong className="text-slate-800">{candidate.score || '—'}</strong>/100</span>
                      <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}

                {stageCandidates.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    No candidates currently in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CANDIDATE PIPELINE INSPECTOR MODAL */}
      <Modal
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate?.name || 'Pipeline Candidate Inspector'}
        subtitle={`Current Stage: ${selectedCandidate?.stage} • Role: ${selectedCandidate?.appliedRole}`}
      >
        {selectedCandidate && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Current Round</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedCandidate.currentRound}</div>
              </div>
              <StatusBadge status={selectedCandidate.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Evaluator Score</span>
                <div className="text-xl font-extrabold text-indigo-600 mt-0.5">
                  {selectedCandidate.score || 85} / 100
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Application Date</span>
                <div className="font-semibold text-slate-800 mt-1 font-mono">
                  {selectedCandidate.appliedDate}
                </div>
              </div>
            </div>

            {/* Quick Status Setter */}
            <div>
              <span className="font-semibold text-slate-800 block mb-2">Simulate Status Transition</span>
              <div className="grid grid-cols-4 gap-2">
                {['Scheduled', 'Passed', 'Failed', 'Awaiting Evaluation'].map(st => (
                  <button
                    key={st}
                    onClick={() => handleSetStatus(selectedCandidate.id, st)}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                      selectedCandidate.status === st
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Promote Action */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-indigo-950">Promote to Next Trial Stage</div>
                <div className="text-[11px] text-indigo-700">Advance candidate through the multi-stage crucible</div>
              </div>
              <button
                onClick={() => handlePromote(selectedCandidate.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <span>Advance Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
