import React, { useState } from 'react';
import {
  Cpu,
  Calendar,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info,
  Sliders,
  Check,
  CalendarCheck
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { schedulerService } from '../../services/schedulerService';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function SchedulerPage() {
  const { showToast } = useToast();

  const [drives] = useState(() => storageService.getDrives());
  const [candidates] = useState(() => storageService.getCandidates());
  const [interviewers] = useState(() => storageService.getInterviewers());
  const [rooms] = useState(() => storageService.getRooms());

  // Configuration Form State
  const [selectedDriveId, setSelectedDriveId] = useState('drv-101');
  const [selectedRound, setSelectedRound] = useState('System Architecture');
  const [startDate, setStartDate] = useState('2026-10-26');
  const [endDate, setEndDate] = useState('2026-10-30');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [enforceHardCapacity, setEnforceHardCapacity] = useState(true);

  // Solver execution state
  const [isSolving, setIsSolving] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [appliedToMaster, setAppliedToMaster] = useState(false);

  const selectedDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  const handleGenerateSchedule = async () => {
    setIsSolving(true);
    setAppliedToMaster(false);

    try {
      const result = await schedulerService.runSolver({
        driveId: selectedDriveId,
        roundName: selectedRound,
        startDate,
        endDate,
        durationMinutes: Number(durationMinutes),
        bufferMinutes: Number(bufferMinutes),
        candidates,
        interviewers,
        rooms
      });

      setSolverResult(result);
      showToast('Deterministic CSP solver evaluated constraints successfully!', 'success', 'Schedule Generated');
    } catch (err) {
      console.error(err);
      showToast('Error during schedule generation', 'error');
    } finally {
      setIsSolving(false);
    }
  };

  const handleApplyToCalendar = () => {
    if (!solverResult?.assignments) return;

    // Save assignments to storage
    solverResult.assignments.forEach(item => {
      storageService.saveInterview(item);
    });

    // Also record a notification
    storageService.saveInterview({
      id: `intv-applied-${Date.now()}`,
      candidateName: solverResult.assignments[0]?.candidateName || 'Batch Candidate',
      roundTitle: selectedRound,
      date: startDate,
      startTime: '10:00',
      endTime: '11:00',
      roomName: 'Virtual Cloud Chamber 1',
      interviewerNames: ['Dr. Evelyn Voss'],
      roundType: 'Technical',
      status: 'Scheduled'
    });

    setAppliedToMaster(true);
    showToast(
      `${solverResult.assignments.length} generated interviews synchronized to Master Calendar!`,
      'success',
      'Schedule Synchronized'
    );
  };

  const handleResolveConflict = (conflictId) => {
    if (!solverResult) return;
    const updatedConflicts = solverResult.conflicts.filter(c => c.id !== conflictId);
    setSolverResult({
      ...solverResult,
      conflicts: updatedConflicts
    });
    showToast('Conflict resolved: Panel reallocated to Dr. Evelyn Voss at 16:00', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Schedule Generator"
        subtitle="Simulated Constraint-Satisfaction Problem (CSP) solver engine balancing candidate availability, interviewer load caps, and chamber AV hardware"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Schedule Generator' }
        ]}
      />

      {/* Solver Configuration Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Solver Parameters & Boundaries</h3>
              <p className="text-xs text-slate-500">Configure hard constraints and window preferences for batch interview synthesis</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            AC-3 Solver v1.0
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Drive selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Recruitment Drive</label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {drives.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Round selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Interview Round</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Coding Challenge">Round 1: Coding Challenge</option>
              <option value="System Architecture">Round 2: System Architecture</option>
              <option value="Leadership & Fit">Round 3: Leadership & Cultural Fit</option>
            </select>
          </div>

          {/* Window Range */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Secondary options row */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-center">
          <div className="flex items-center gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Buffer Gap</label>
              <select
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>

          {/* Resource capacities summary badges */}
          <div className="flex items-center gap-2 flex-wrap text-slate-500">
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {candidates.length} Candidates Pool
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              {interviewers.filter(i => i.status === 'Available').length} Active Interviewers
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {rooms.filter(r => r.status === 'Available').length} Usable Chambers
            </span>
          </div>

          {/* Run button */}
          <div className="flex justify-start sm:justify-end">
            <button
              onClick={handleGenerateSchedule}
              disabled={isSolving}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${
                isSolving
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Cpu className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
              <span>{isSolving ? 'Solving CSP Constraints...' : 'Generate Schedule'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SOLVER TELEMETRY BAR (Appears when solver has run) */}
      {solverResult && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                CSP Engine Execution Telemetry
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">
                Optimal Assignment Matrix Resolved
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApplyToCalendar}
                disabled={appliedToMaster}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  appliedToMaster
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/30'
                }`}
              >
                {appliedToMaster ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Synchronized to Master Calendar</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    <span>Apply to Master Calendar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Algorithm</span>
              <div className="font-semibold text-slate-200 mt-0.5 truncate">AC-3 Arc Consistency</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Execution Latency</span>
              <div className="font-bold text-emerald-400 mt-0.5 font-mono">{solverResult.stats.executionTimeMs} ms</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rules Checked</span>
              <div className="font-bold text-white mt-0.5 font-mono">{solverResult.stats.constraintsChecked} constraints</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Optimality Index</span>
              <div className="font-bold text-indigo-400 mt-0.5 font-mono">{solverResult.stats.optimalityScore}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled Slots</span>
              <div className="font-bold text-emerald-400 mt-0.5 font-mono">{solverResult.assignments.length} candidates</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Conflicts Flagged</span>
              <div className="font-bold text-amber-400 mt-0.5 font-mono">{solverResult.conflicts.length} alert</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Results Display */}
      {solverResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generated Time Slot Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generated Interview Assignments</h3>
                  <p className="text-xs text-slate-500">Deterministic slot pairings generated by constraint satisfaction heuristics</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {solverResult.assignments.length} slots computed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {solverResult.assignments.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.candidateName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.candidateRole}</div>
                      </div>
                      <StatusBadge status={item.roundType} type="round" />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Interviewer:</span>
                        <span className="font-semibold text-slate-800">{item.interviewerNames.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Room / Hub:</span>
                        <span className="text-slate-700 truncate max-w-[140px]">{item.roomName}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-indigo-700 bg-indigo-50/60 p-1 rounded">
                        <span>{item.date}</span>
                        <span>{item.startTime} - {item.endTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Column: Conflicts & Unscheduled pool */}
          <div className="space-y-6">
            {/* Conflict Summary Panel */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Constraint Conflict Monitor</h3>
                </div>
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  solverResult.conflicts.length > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {solverResult.conflicts.length}
                </span>
              </div>

              {solverResult.conflicts.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-center">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  All hard and soft constraints satisfied! Zero schedule overlaps.
                </div>
              ) : (
                <div className="space-y-3">
                  {solverResult.conflicts.map((cnf) => (
                    <div key={cnf.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-700">
                      <div className="flex items-center justify-between font-semibold text-amber-900 mb-1">
                        <span>{cnf.type}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 uppercase">
                          {cnf.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-snug">{cnf.description}</p>
                      
                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 font-medium">Recommended: {cnf.recommendedAction}</span>
                      </div>
                      <button
                        onClick={() => handleResolveConflict(cnf.id)}
                        className="mt-2 w-full py-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
                      >
                        Auto-Resolve Conflict
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unscheduled Interviews List */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Unscheduled Queue</h3>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {solverResult.unscheduled.length} waiting
                </span>
              </div>

              {solverResult.unscheduled.length === 0 ? (
                <p className="text-xs text-slate-400 italic">All candidate slots were accommodated in this run.</p>
              ) : (
                <div className="space-y-2.5">
                  {solverResult.unscheduled.map((u, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-800">{u.candidateName}</div>
                      <div className="text-[11px] text-slate-500">{u.role}</div>
                      <div className="mt-1 text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100">
                        Reason: {u.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">CSP Generator Ready</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Select your target recruitment drive and parameters above, then click <strong>"Generate Schedule"</strong> to simulate deterministic constraint satisfaction matching.
          </p>
          <button
            onClick={handleGenerateSchedule}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Demo Schedule Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
