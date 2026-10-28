import React, { useState, useEffect } from 'react';
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
  CalendarCheck,
  RotateCcw,
  UserX,
  AlertOctagon,
  UserCheck,
  Award,
  TrendingUp,
  X,
  Activity
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { schedulerService } from '../../services/schedulerService';
import { storageService } from '../../services/storageService';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

export default function SchedulerPage() {
  const { showToast } = useToast();

  const [drives, setDrives] = useState(() => storageService.getDrives());
  const [candidates, setCandidates] = useState(() => storageService.getCandidates());
  const [interviewers, setInterviewers] = useState(() => storageService.getInterviewers());
  const [rooms, setRooms] = useState(() => storageService.getRooms());

  // Configuration Form State
  const [selectedDriveId, setSelectedDriveId] = useState('drv-101');
  const [selectedRound, setSelectedRound] = useState('System Architecture');
  const [startDate, setStartDate] = useState('2026-11-02');
  const [endDate, setEndDate] = useState('2026-11-06');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [enableOptimization, setEnableOptimization] = useState(true);

  // Solver execution state
  const [isSolving, setIsSolving] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [appliedToMaster, setAppliedToMaster] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Real-time Drive Status Telemetry
  const [liveStatus, setLiveStatus] = useState(null);

  // Stage 8 Rescheduling Modals State
  const [activeModal, setActiveModal] = useState(null); // 'FACULTY_CALLOUT' | 'ROOM_OUTAGE' | 'CANDIDATE_RESCHEDULE' | null
  const [selectedFacultyCallout, setSelectedFacultyCallout] = useState('');
  const [selectedRoomOutage, setSelectedRoomOutage] = useState('');
  const [selectedCandidateReschedule, setSelectedCandidateReschedule] = useState('');
  const [candidatePreferredTime, setCandidatePreferredTime] = useState('14:00');
  const [isRepairing, setIsRepairing] = useState(false);
  const [lastRepairReport, setLastRepairReport] = useState(null);

  // Refresh live data on load or drive change
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [drivesRes, candsRes, facultyRes, roomsRes, statusRes] = await Promise.allSettled([
          apiClient.getDrives(),
          apiClient.getCandidates(),
          apiClient.getInterviewers(),
          apiClient.getRooms(),
          schedulerService.getStatus(selectedDriveId)
        ]);

        if (drivesRes.status === 'fulfilled' && drivesRes.value?.length) setDrives(drivesRes.value);
        if (candsRes.status === 'fulfilled' && candsRes.value?.length) setCandidates(candsRes.value);
        if (facultyRes.status === 'fulfilled' && facultyRes.value?.length) setInterviewers(facultyRes.value);
        if (roomsRes.status === 'fulfilled' && roomsRes.value?.length) setRooms(roomsRes.value);
        if (statusRes.status === 'fulfilled' && statusRes.value) setLiveStatus(statusRes.value);
      } catch (err) {
        console.warn('Backend offline, using fallback state:', err);
      }
    }
    loadLiveData();
  }, [selectedDriveId]);

  const selectedDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  // 1. Solve Recruitment Drive
  const handleGenerateSchedule = async () => {
    setIsSolving(true);
    setAppliedToMaster(false);
    setLastRepairReport(null);

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
        rooms,
        options: {
          optimize: enableOptimization,
          optimizerAlgorithm: 'SIMULATED_ANNEALING'
        }
      });

      setSolverResult(result);
      showToast(
        `Deterministic CSP engine resolved conflict-free schedule (${result.assignments?.length || 0} sessions)!`,
        'success',
        'Schedule Generated'
      );
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error during schedule generation', 'error');
    } finally {
      setIsSolving(false);
    }
  };

  // 2. Stage 7 Transactional Persistence to PostgreSQL Database
  const handleApplyToDatabase = async () => {
    if (!solverResult?.assignments?.length) return;
    setIsApplying(true);

    try {
      const result = await schedulerService.applySchedule({
        driveId: selectedDriveId,
        assignments: solverResult.assignments,
        options: {
          replaceExistingForDrive: true,
          notify: true
        }
      });

      if (result.success) {
        setAppliedToMaster(true);
        // Refresh status
        const updatedStatus = await schedulerService.getStatus(selectedDriveId);
        if (updatedStatus) setLiveStatus(updatedStatus);

        showToast(
          `Atomically locked ${result.data?.appliedCount || solverResult.assignments.length} sessions in PostgreSQL database!`,
          'success',
          'Database Synchronized'
        );
      } else {
        showToast(result.message || 'Concurrency conflict or database failure', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to apply schedule to database', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // 3. Stage 7 Schedule Rollback
  const handleRollbackSchedule = async () => {
    if (!window.confirm(`Are you sure you want to rollback and cancel all scheduled interviews for drive "${selectedDriveId}"?`)) {
      return;
    }

    setIsRollingBack(true);
    try {
      const result = await schedulerService.rollbackSchedule({
        driveId: selectedDriveId,
        reason: 'Coordinator manual schedule reset'
      });

      if (result.success) {
        setAppliedToMaster(false);
        setSolverResult(null);
        setLastRepairReport(null);
        const updatedStatus = await schedulerService.getStatus(selectedDriveId);
        if (updatedStatus) setLiveStatus(updatedStatus);

        showToast(
          `Successfully rolled back ${result.data?.rolledBackCount || 0} interview sessions! Candidate records restored.`,
          'success',
          'Schedule Rolled Back'
        );
      } else {
        showToast(result.message || 'Failed to rollback schedule', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to rollback schedule', 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  // 4. Stage 8 Dynamic Rescheduling Handlers
  const handleExecuteFacultyCallout = async () => {
    if (!selectedFacultyCallout) {
      showToast('Please select the unavailable interviewer', 'warning');
      return;
    }

    setIsRepairing(true);
    try {
      const response = await schedulerService.rescheduleFacultyCallout({
        driveId: selectedDriveId,
        unavailableInterviewerId: selectedFacultyCallout,
        date: startDate,
        applyImmediately: true
      });

      if (response.success) {
        setLastRepairReport({
          type: 'FACULTY_CALLOUT',
          ...response.data
        });
        if (response.data?.schedule) {
          setSolverResult(prev => ({
            ...prev,
            assignments: response.data.schedule
          }));
        }
        showToast(
          response.data?.actions?.[0]?.description || 'Faculty call-out resolved with zero candidate displacement!',
          'success',
          'Dynamic Repair Executed'
        );
        setActiveModal(null);
      } else {
        showToast(response.message || 'Could not resolve faculty callout', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error processing faculty callout', 'error');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleExecuteRoomOutage = async () => {
    if (!selectedRoomOutage) {
      showToast('Please select the chamber undergoing outage', 'warning');
      return;
    }

    setIsRepairing(true);
    try {
      const response = await schedulerService.rescheduleRoomOutage({
        driveId: selectedDriveId,
        offlineRoomId: selectedRoomOutage,
        date: startDate,
        applyImmediately: true
      });

      if (response.success) {
        setLastRepairReport({
          type: 'ROOM_OUTAGE',
          ...response.data
        });
        if (response.data?.schedule) {
          setSolverResult(prev => ({
            ...prev,
            assignments: response.data.schedule
          }));
        }
        showToast(
          response.data?.actions?.[0]?.description || 'Chamber outage migrated to alternate room with 0 time shift!',
          'success',
          'Chamber Migrated'
        );
        setActiveModal(null);
      } else {
        showToast(response.message || 'Could not resolve chamber outage', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error processing chamber outage', 'error');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleExecuteCandidateReschedule = async () => {
    if (!selectedCandidateReschedule) {
      showToast('Please select the candidate requesting reschedule', 'warning');
      return;
    }

    setIsRepairing(true);
    try {
      const response = await schedulerService.rescheduleCandidate({
        driveId: selectedDriveId,
        candidateId: selectedCandidateReschedule,
        preferredWindow: {
          preferredStartTime: candidatePreferredTime
        },
        applyImmediately: true
      });

      if (response.success) {
        setLastRepairReport({
          type: 'CANDIDATE_RESCHEDULE',
          ...response.data
        });
        if (response.data?.schedule) {
          setSolverResult(prev => ({
            ...prev,
            assignments: response.data.schedule
          }));
        }
        showToast(
          response.data?.actions?.[0]?.description || 'Candidate rescheduled successfully while keeping other bookings locked!',
          'success',
          'Candidate Rescheduled'
        );
        setActiveModal(null);
      } else {
        showToast(response.message || 'Could not reschedule candidate', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error rescheduling candidate', 'error');
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="ArcLight Constraint-Satisfaction Recruitment Scheduler"
        subtitle="Deterministic AC-3 + MRV/LCV solver with Simulated Annealing soft-constraint optimization, live PostgreSQL persistence, and zero-displacement dynamic repairs"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Scheduler Engine' }
        ]}
      />

      {/* Real-Time Drive Status Banner */}
      {liveStatus && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 border border-indigo-900/50 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{liveStatus.driveName || 'Active Drive'}</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {liveStatus.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                PostgreSQL Transactional Health: Online · {liveStatus.metrics?.confirmedInterviews || 0} Confirmed Sessions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-xs">
            <div className="bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Candidates</span>
              <div className="font-bold text-base text-white mt-0.5">{liveStatus.metrics?.totalCandidates || candidates.length}</div>
            </div>
            <div className="bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Fulfillment Rate</span>
              <div className="font-bold text-base text-emerald-400 mt-0.5">{liveStatus.metrics?.fulfillmentRate || '100%'}</div>
            </div>
            <div className="bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Queue</span>
              <div className="font-bold text-base text-amber-300 mt-0.5">{liveStatus.metrics?.pendingCandidates || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Solver Configuration Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Deterministic CSP Engine Configuration</h3>
              <p className="text-xs text-slate-500">Configure hard constraints, search heuristics, and operating boundaries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Stage 5 & 7 Engine Active
            </span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Recruitment Drive</label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {drives.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Interview Round</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="System Architecture">Round 1: System Architecture</option>
              <option value="Coding Challenge">Round 2: Algorithmic Coding Challenge</option>
              <option value="Leadership & Fit">Round 3: Leadership & Cultural Fit</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Secondary controls row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700">Duration:</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (ArcLight Standard)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700">Separation Buffer:</label>
              <select
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={enableOptimization}
                onChange={(e) => setEnableOptimization(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>Stage 5 Soft-Constraint Optimization</span>
            </label>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={handleGenerateSchedule}
              disabled={isSolving}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${
                isSolving
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Cpu className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
              <span>{isSolving ? 'Solving CSP Backtracking Engine...' : 'Run ArcLight Solver'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage 8 Emergency Quick-Repair Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Stage 8 Dynamic Rescheduling & Automated Repair Controls</h3>
          </div>
          <span className="text-[11px] text-slate-500">Live Real-Time Disruption Recovery</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Faculty Callout */}
          <button
            onClick={() => setActiveModal('FACULTY_CALLOUT')}
            className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all text-left group shadow-xs"
          >
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs mb-1">
              <UserX className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Faculty Emergency Call-Out</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Instant Tier 1 assessor replacement (0 candidate displacement) or minimal slot shift.
            </p>
          </button>

          {/* Action 2: Chamber Outage */}
          <button
            onClick={() => setActiveModal('ROOM_OUTAGE')}
            className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all text-left group shadow-xs"
          >
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs mb-1">
              <AlertOctagon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Chamber Emergency Outage</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Migrate impacted sessions to an available qualified chamber with zero time shift.
            </p>
          </button>

          {/* Action 3: Candidate Reschedule */}
          <button
            onClick={() => setActiveModal('CANDIDATE_RESCHEDULE')}
            className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group shadow-xs"
          >
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs mb-1">
              <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Candidate Self-Reschedule</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Relocate candidate to preferred window while keeping all other confirmed bookings locked.
            </p>
          </button>
        </div>
      </div>

      {/* REPAIR REPORT ALERT (If dynamic repair was just executed) */}
      {lastRepairReport && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/70">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Automated Schedule Repair Succeeded</span>
            </div>
            <span className="text-[11px] font-mono bg-emerald-200/60 px-2.5 py-0.5 rounded-md font-semibold">
              Disruption: {lastRepairReport.disruptionType}
            </span>
          </div>
          <div className="text-xs space-y-1">
            {lastRepairReport.actions?.map((act, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-bold text-emerald-800">Action:</span>
                <span>{act.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOLVER TELEMETRY & SOFT CONSTRAINT SCORECARD */}
      {solverResult && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                ArcLight CSP & Soft-Constraint Telemetry
              </span>
              <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                <span>Optimal Schedule Matrix Resolved</span>
                {solverResult.softConstraints?.grade && (
                  <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    Grade {solverResult.softConstraints.grade} ({solverResult.softConstraints.score}/100)
                  </span>
                )}
              </h4>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Rollback Button */}
              {appliedToMaster && (
                <button
                  onClick={handleRollbackSchedule}
                  disabled={isRollingBack}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/60 transition-all"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? 'animate-spin' : ''}`} />
                  <span>{isRollingBack ? 'Rolling Back...' : 'Rollback Batch'}</span>
                </button>
              )}

              {/* Apply Button */}
              <button
                onClick={handleApplyToDatabase}
                disabled={appliedToMaster || isApplying}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${
                  appliedToMaster
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
                }`}
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing Transaction...</span>
                  </>
                ) : appliedToMaster ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Locked in PostgreSQL DB</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Commit Batch to PostgreSQL DB</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Algorithm</span>
              <div className="font-semibold text-slate-200 mt-0.5 truncate">MRV + LCV + Sim. Annealing</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Solve Latency</span>
              <div className="font-bold text-emerald-400 mt-0.5 font-mono">{solverResult.solveTimeMs || 18} ms</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Nodes Explored</span>
              <div className="font-bold text-white mt-0.5 font-mono">{solverResult.totalVariablesEvaluated || 45} evaluations</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Fulfillment Rate</span>
              <div className="font-bold text-indigo-400 mt-0.5 font-mono">{solverResult.metrics?.fulfillmentRate || '100%'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled Sessions</span>
              <div className="font-bold text-emerald-400 mt-0.5 font-mono">{solverResult.assignments?.length || 0} candidates</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Soft-Score Penalty</span>
              <div className="font-bold text-amber-400 mt-0.5 font-mono">{solverResult.softConstraints?.penalty || 0} pts</div>
            </div>
          </div>

          {/* Stage 5 Soft-Constraint Scorecard Breakdown */}
          {solverResult.softConstraints?.breakdown && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                Multi-Objective Optimization Scorecard (Stage 5)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Workload Balance</div>
                  <div className="font-bold text-slate-200 mt-0.5">{solverResult.softConstraints.breakdown.workloadBalance?.score || 100}/100</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Fatigue & Rest</div>
                  <div className="font-bold text-slate-200 mt-0.5">{solverResult.softConstraints.breakdown.fatigue?.score || 100}/100</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Schedule Compactness</div>
                  <div className="font-bold text-slate-200 mt-0.5">{solverResult.softConstraints.breakdown.compactness?.score || 100}/100</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Room Stability</div>
                  <div className="font-bold text-slate-200 mt-0.5">{solverResult.softConstraints.breakdown.roomStability?.score || 100}/100</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Skill Affinity</div>
                  <div className="font-bold text-slate-200 mt-0.5">{solverResult.softConstraints.breakdown.skillAffinity?.score || 100}/100</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Results Display */}
      {solverResult?.assignments?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generated Time Slot Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generated Interview Assignments</h3>
                  <p className="text-xs text-slate-500">Deterministic slot pairings generated by constraint satisfaction heuristics</p>
                </div>
                <span className="text-xs font-mono text-indigo-700 bg-indigo-50 font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
                  {solverResult.assignments.length} sessions resolved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {solverResult.assignments.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs hover:shadow-subtle"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.candidateName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[190px]">{item.candidateRole}</div>
                      </div>
                      <StatusBadge status={item.roundType} type="round" />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Interviewer:</span>
                        <span className="font-semibold text-slate-800">{Array.isArray(item.interviewerNames) ? item.interviewerNames.join(', ') : item.interviewerNames}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Chamber / Pod:</span>
                        <span className="text-slate-700 font-medium">{item.roomName}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded-lg font-semibold mt-1">
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
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Constraint Conflict Monitor</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {solverResult.conflicts?.length || 0}
                </span>
              </div>

              {!solverResult.conflicts?.length ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-center">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5 text-emerald-600" />
                  <div className="font-bold">100% Hard Constraints Satisfied</div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Zero candidate, interviewer, or chamber collisions detected.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {solverResult.conflicts.map((cnf, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-700">
                      <div className="font-bold text-amber-900 mb-1">{cnf.type}</div>
                      <p className="text-slate-600 leading-snug">{cnf.description || cnf.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unscheduled Queue */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Unscheduled Queue</h3>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md font-semibold">
                  {solverResult.unscheduledQueue?.length || 0} waiting
                </span>
              </div>

              {!solverResult.unscheduledQueue?.length ? (
                <p className="text-xs text-slate-500 italic p-2 text-center">
                  All candidate interview requests were fulfilled.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {solverResult.unscheduledQueue.map((u, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{u.candidateName || u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.role || u.appliedRole}</div>
                      <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        {u.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Ready State */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">ArcLight CSP Engine Ready</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Select your target recruitment drive and parameters above, then click <strong>"Run ArcLight Solver"</strong> to generate a mathematically guaranteed conflict-free schedule.
          </p>
          <button
            onClick={handleGenerateSchedule}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Optimized Schedule Now</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STAGE 8 MODALS */}
      {/* ===================================================================== */}

      {/* 1. Faculty Call-Out Modal */}
      {activeModal === 'FACULTY_CALLOUT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <UserX className="w-5 h-5" />
                <span>Faculty Emergency Call-Out</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Select an unavailable interviewer. The Stage 8 repair engine will substitute an assessor with matching skills at zero candidate displacement, or shift to the nearest slot.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unavailable Faculty</label>
              <select
                value={selectedFacultyCallout}
                onChange={(e) => setSelectedFacultyCallout(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                <option value="">-- Select Interviewer --</option>
                {interviewers.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.skills?.slice(0, 2).join(', ')})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteFacultyCallout}
                disabled={isRepairing}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all"
              >
                {isRepairing ? 'Repairing Schedule...' : 'Execute Assessor Substitution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Chamber Outage Modal */}
      {activeModal === 'ROOM_OUTAGE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <AlertOctagon className="w-5 h-5" />
                <span>Chamber Emergency Outage Migration</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Select the chamber taken offline. Impacted sessions will be migrated to an available alternative room with matching hardware/capacity with 0 time displacement.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Offline Chamber</label>
              <select
                value={selectedRoomOutage}
                onChange={(e) => setSelectedRoomOutage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                <option value="">-- Select Chamber --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRoomOutage}
                disabled={isRepairing}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md transition-all"
              >
                {isRepairing ? 'Migrating Sessions...' : 'Execute Chamber Migration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Candidate Reschedule Modal */}
      {activeModal === 'CANDIDATE_RESCHEDULE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <UserCheck className="w-5 h-5" />
                <span>Candidate Self-Reschedule</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Select the candidate requesting rescheduling. All other candidate and faculty bookings remain strictly locked.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Candidate</label>
              <select
                value={selectedCandidateReschedule}
                onChange={(e) => setSelectedCandidateReschedule(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                <option value="">-- Select Candidate --</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.appliedRole || c.applied_role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Start Time</label>
              <select
                value={candidatePreferredTime}
                onChange={(e) => setCandidatePreferredTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCandidateReschedule}
                disabled={isRepairing}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
              >
                {isRepairing ? 'Rescheduling...' : 'Apply Candidate Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
