import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  User,
  AlertTriangle,
  Plus,
  Download,
  CheckCircle2,
  Calendar,
  Briefcase,
  UserCheck,
  Cpu,
  Layers,
  Activity,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { mockOverviewChartData, mockRoundFunnel } from '../../data/mockReports';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [drives, setDrives] = useState(() => storageService.getDrives());
  const [candidates, setCandidates] = useState(() => storageService.getCandidates());
  const [interviewers, setInterviewers] = useState(() => storageService.getInterviewers());
  const [interviews, setInterviews] = useState(() => storageService.getInterviews());

  // Modal states
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isInterviewerModalOpen, setIsInterviewerModalOpen] = useState(false);
  const [selectedInterviewModal, setSelectedInterviewModal] = useState(null);
  const [pageIndex, setPageIndex] = useState(2);

  // New Drive form state
  const [driveName, setDriveName] = useState('');
  const [driveRole, setDriveRole] = useState('');
  const [driveCompany, setDriveCompany] = useState('Northstar Labs');

  // New Candidate form state
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candRole, setCandRole] = useState('Senior Systems Engineer');

  // New Interviewer form state
  const [intName, setIntName] = useState('');
  const [intEmail, setIntEmail] = useState('');
  const [intSkills, setIntSkills] = useState('Distributed Systems, Go');

  const handleCreateDrive = (e) => {
    e.preventDefault();
    if (!driveName || !driveRole) {
      showToast('Please provide drive name and target role', 'warning');
      return;
    }
    const newDrive = {
      name: driveName,
      company: driveCompany,
      role: driveRole,
      startDate: '2026-11-09',
      endDate: '2026-11-13',
      candidatesCount: 80,
      rounds: ['R1 Technical Screen', 'R2 Architecture', 'R3 Leadership'],
      status: 'Active',
      targetHires: 10,
      completedInterviews: 0,
      totalScheduled: 0,
    };
    const updated = storageService.saveDrive(newDrive);
    setDrives(updated);
    setIsDriveModalOpen(false);
    setDriveName('');
    setDriveRole('');
    showToast(`Placement drive "${driveName}" created successfully!`, 'success');
  };

  const handleAddCandidate = (e) => {
    e.preventDefault();
    if (!candName || !candEmail) {
      showToast('Candidate name and email are required', 'warning');
      return;
    }
    const newCand = {
      name: candName,
      email: candEmail,
      appliedRole: candRole,
      driveId: drives[0]?.id || 'drv-101',
      skills: ['Distributed Systems', 'Algorithms'],
      currentRound: 'Technical Screen',
      stage: 'Screening',
      status: 'Scheduled',
      appliedDate: '2026-11-02'
    };
    const updated = storageService.saveCandidate(newCand);
    setCandidates(updated);
    setIsCandidateModalOpen(false);
    setCandName('');
    setCandEmail('');
    showToast(`Candidate ${candName} added to placement queue!`, 'success');
  };

  const handleAddInterviewer = (e) => {
    e.preventDefault();
    if (!intName || !intEmail) {
      showToast('Interviewer name and email are required', 'warning');
      return;
    }
    const newInt = {
      name: intName,
      email: intEmail,
      title: 'Senior Faculty Assessor',
      department: 'Engineering',
      skills: intSkills.split(',').map(s => s.trim()),
      maxInterviewsPerDay: 3,
      availabilitySummary: 'Mon, Wed, Fri (10:00 - 16:00)',
      status: 'Available',
      assignedInterviews: 0
    };
    const updated = storageService.saveInterviewer(newInt);
    setInterviewers(updated);
    setIsInterviewerModalOpen(false);
    setIntName('');
    setIntEmail('');
    showToast(`Interviewer ${intName} added to evaluation panel!`, 'success');
  };

  const handleExportReport = () => {
    showToast('Placement week report exported to PDF & CSV summary.', 'success');
  };

  // Recent activity mock entries
  const recentActivities = [
    { id: 1, title: 'Schedule Generated', desc: 'CSP solver assigned 228 sessions with 0 double bookings', time: '12m ago', type: 'system' },
    { id: 2, title: 'Slot Confirmed', desc: 'Aanya Shah self-confirmed R1 Technical Screen at 09:00', time: '28m ago', type: 'candidate' },
    { id: 3, title: 'Scorecard Submitted', desc: 'Priya Nair completed rubric evaluation for Dev Joshi', time: '1h ago', type: 'interviewer' },
    { id: 4, title: 'Conflict Flagged', desc: 'Panel A overlap on Wednesday 10:00 needs coordinator review', time: '2h ago', type: 'alert' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header section with spacious typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
        <div>
          {/* Breadcrumb */}
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            WEBSTER 2026 / OVERVIEW
          </div>
          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
            A clearer view of placement week.
          </h1>
          {/* Subtitle */}
          <p className="text-sm text-slate-500 font-normal mt-1 leading-relaxed">
            Good morning, Maya. Here's what needs your attention for Webster 2026. Wednesday, Nov 4, 2026.
          </p>
        </div>

        {/* Action Buttons at top right */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-colors"
          >
            Export report
          </button>
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl shadow-sm shadow-indigo-600/20 transition-all hover:translate-y-[-0.5px]"
          >
            Create drive +
          </button>
        </div>
      </div>

      {/* 2. 4 Stat Cards Row with spacious cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active placement drives</span>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">4</span>
          </div>
          <div className="mt-3 text-xs font-medium text-emerald-600">
            2 opening this week
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Candidates in Northstar</span>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">240</span>
          </div>
          <div className="mt-3 text-xs font-medium text-emerald-600">
            228 scheduled · 95% coverage
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Interviews this week</span>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">228</span>
          </div>
          <div className="mt-3 text-xs font-medium text-emerald-600">
            Across 8 panels · 6 rooms
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Needs your attention</span>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">3</span>
          </div>
          <div className="mt-3 text-xs font-medium text-amber-600">
            2 conflicts · 1 dropout request
          </div>
        </div>
      </div>

      {/* 3. Amber Notification Banner */}
      <div className="p-5 rounded-2xl bg-[#fffbeb] border border-[#fef08a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
        <div>
          <h4 className="font-bold text-[#78350f] text-sm">
            Three scheduling issues, one place to resolve them.
          </h4>
          <p className="text-[#92400e] mt-1 leading-relaxed">
            Two availability conflicts and Alex Rivera's dropout request need a coordinator review.
          </p>
        </div>
        <Link
          to="/coordinator/scheduler"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#78350f] bg-white/80 hover:bg-white border border-[#fde68a] rounded-xl transition-colors shadow-2xs shrink-0"
        >
          <span>Review issues</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Main Two-Column Layout matching Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Your Placement Week Calendar (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your placement week</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Northstar Labs · November 2–6 · Asia/Kolkata
              </p>
            </div>
            {/* Open calendar: distinct destination to /coordinator/calendar */}
            <Link
              to="/coordinator/calendar"
              className="text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] flex items-center gap-1"
            >
              <span>Open calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Calendar Grid matching Screenshot 2 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Header Columns */}
            <div className="grid grid-cols-6 bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700 text-center">
              <div className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-400">
                IST
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#4f46e5] bg-[#eef2ff]/40">
                MON 02
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                TUE 03
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                WED 04
              </div>
              <div className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                THU 05
              </div>
              <div className="py-2.5 px-3 text-slate-600">
                FRI 06
              </div>
            </div>

            {/* Row 09:00 */}
            <div className="grid grid-cols-6 min-h-[96px] border-b border-slate-100">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200 bg-slate-50/20">
                09:00
              </div>

              {/* MON 02: Aanya Shah */}
              <div className="p-1.5 border-r border-slate-100 bg-[#f8f9ff]/40">
                <div
                  onClick={() => setSelectedInterviewModal(interviews[0])}
                  className="p-2.5 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <div className="text-[10px] font-mono text-[#4f46e5]">09:00–09:45</div>
                  <div className="font-bold text-xs text-[#312e81] mt-0.5">Aanya Shah</div>
                  <div className="text-[10px] text-[#4338ca] mt-0.5">R1 · Priya · C-201</div>
                </div>
              </div>

              {/* TUE 03: Empty */}
              <div className="p-1.5 border-r border-slate-100" />

              {/* WED 04: Dev Joshi */}
              <div className="p-1.5 border-r border-slate-100">
                <div
                  onClick={() => setSelectedInterviewModal(interviews[1])}
                  className="p-2.5 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <div className="text-[10px] font-mono text-[#4f46e5]">09:00–09:45</div>
                  <div className="font-bold text-xs text-[#312e81] mt-0.5">Dev Joshi</div>
                  <div className="text-[10px] text-[#4338ca] mt-0.5">R1 · Priya · C-201</div>
                </div>
              </div>

              {/* THU 05: Empty */}
              <div className="p-1.5 border-r border-slate-100" />

              {/* FRI 06: Rohan Mehta */}
              <div className="p-1.5">
                <div
                  onClick={() => setSelectedInterviewModal(interviews[2])}
                  className="p-2.5 rounded-lg bg-[#eef2ff] border border-[#e0e7ff] text-left cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <div className="text-[10px] font-mono text-[#4f46e5]">09:00–09:30</div>
                  <div className="font-bold text-xs text-[#312e81] mt-0.5">Rohan Mehta</div>
                  <div className="text-[10px] text-[#4338ca] mt-0.5">R1 · Devon · C-203</div>
                </div>
              </div>
            </div>

            {/* Row 10:00 */}
            <div className="grid grid-cols-6 min-h-[96px]">
              <div className="p-3 font-mono text-[11px] text-slate-400 text-center border-r border-slate-200 bg-slate-50/20">
                10:00
              </div>

              {/* MON 02 */}
              <div className="p-1.5 border-r border-slate-100" />

              {/* TUE 03: Neha Kapoor */}
              <div className="p-1.5 border-r border-slate-100">
                <div
                  onClick={() => setSelectedInterviewModal(interviews[3])}
                  className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100 text-left cursor-pointer hover:border-cyan-300 transition-colors"
                >
                  <div className="text-[10px] font-mono text-cyan-700">10:00–10:45</div>
                  <div className="font-bold text-xs text-cyan-950 mt-0.5">Neha Kapoor</div>
                  <div className="text-[10px] text-cyan-700 mt-0.5">R1 · Aria · C-202</div>
                </div>
              </div>

              {/* WED 04: Conflict · Panel A */}
              <div className="p-1.5 border-r border-slate-100">
                <div
                  onClick={() => setSelectedInterviewModal(interviews[4])}
                  className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-left cursor-pointer hover:border-amber-300 transition-colors"
                >
                  <div className="text-[10px] font-mono text-amber-700">10:00–10:45</div>
                  <div className="font-bold text-xs text-amber-950 mt-0.5">Conflict · Panel A</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Overlap Alert</div>
                </div>
              </div>

              {/* THU 05: Mira Patel */}
              <div className="p-1.5 border-r border-slate-100">
                <div
                  onClick={() => setSelectedInterviewModal(interviews[5])}
                  className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-left cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <div className="text-[10px] font-mono text-emerald-700">10:00–10:45</div>
                  <div className="font-bold text-xs text-emerald-950 mt-0.5">Mira Patel</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">R1 · Priya · C-201</div>
                </div>
              </div>

              {/* FRI 06 */}
              <div className="p-1.5" />
            </div>
          </div>

          {/* Pagination bar matching Screenshot 2: < 2 / 25 > */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-mono">
              <button
                onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                className="hover:text-indigo-400 p-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>{pageIndex} / 25</span>
              <button
                onClick={() => setPageIndex(Math.min(25, pageIndex + 1))}
                className="hover:text-indigo-400 p-0.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Up Next Card (4 cols) matching Screenshot 2 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Up next</h3>
            {/* View all candidates: distinct destination to /coordinator/candidates */}
            <Link
              to="/coordinator/candidates"
              className="text-xs font-semibold text-[#4f46e5] hover:underline"
            >
              View all candidates
            </Link>
          </div>

          {/* Green Badge */}
          <div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              TODAY · 09:00
            </span>
          </div>

          {/* Candidate & Details */}
          <div>
            <h4 className="text-lg font-bold text-slate-900 leading-tight">Aanya Shah</h4>
            <div className="text-xs text-slate-500 mt-0.5">Technical screen · R1</div>
          </div>

          <div className="space-y-1 text-xs text-slate-600 font-medium">
            <div>Priya Nair · C-201</div>
            <div className="text-slate-400 font-mono">09:00–09:45 IST</div>
          </div>

          {/* Full-width Interview Details Button */}
          <div className="pt-2">
            <button
              onClick={() => setSelectedInterviewModal(interviews[0])}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors text-center"
            >
              Interview details
            </button>
          </div>
        </div>
      </div>

      {/* 5. PROMPT-SPECIFIED QUICK ACTIONS BAR (4 Distinct Actions) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Quick Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create Drive</span>
          </button>
          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Candidate</span>
          </button>
          <button
            onClick={() => setIsInterviewerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-violet-600" />
            <span>Add Interviewer</span>
          </button>
          <Link
            to="/coordinator/scheduler"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Generate Schedule</span>
          </Link>
        </div>
      </div>

      {/* 6. PROMPT-SPECIFIED OVERVIEW CHART & ROUND PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scheduling Overview Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Placement Scheduling Throughput</h3>
              <p className="text-xs text-slate-500">Daily scheduled vs completed interviews across Webster 2026 week</p>
            </div>
            <Link to="/coordinator/reports" className="text-xs font-semibold text-indigo-600 hover:underline">
              View Analytics
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockOverviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="scheduled" name="Scheduled Sessions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed Interviews" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruitment Round Progress (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Round Funnel Progress</h3>
            <Link to="/coordinator/pipeline" className="text-xs font-semibold text-indigo-600 hover:underline">
              Pipeline
            </Link>
          </div>

          <div className="space-y-4">
            {mockRoundFunnel.map((item, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-800 font-semibold">{item.stage}</span>
                  <span className="text-slate-500 font-mono">{item.passed} / {item.candidates}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((item.passed / item.candidates) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. PROMPT-SPECIFIED UPCOMING INTERVIEWS TABLE & RECENT ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upcoming Interviews Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming Placement Interviews</h3>
              <p className="text-xs text-slate-500">Real-time candidate sessions synchronized across active panels</p>
            </div>
            <Link to="/coordinator/drives" className="text-xs font-semibold text-indigo-600 hover:underline">
              All Drives
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Round</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Panel</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.candidateName}</div>
                      <div className="text-[11px] text-slate-400">{item.candidateRole}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.roundType} type="round" />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div>{item.date}</div>
                      <div className="text-slate-400">{item.startTime}–{item.endTime}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{item.interviewerNames?.join(', ')}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.roomName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedInterviewModal(item)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Activity Feed</h3>
            <Link to="/coordinator/notifications" className="text-xs font-semibold text-indigo-600 hover:underline">
              Notifications
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE DRIVE MODAL */}
      <Modal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        title="Create Placement Drive"
        subtitle="Initialize a new campus recruitment campaign"
      >
        <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Drive Name *</label>
            <input
              type="text"
              required
              value={driveName}
              onChange={(e) => setDriveName(e.target.value)}
              placeholder="e.g. Apex Dynamics · Full-Stack Surge"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={driveCompany}
                onChange={(e) => setDriveCompany(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Role Title *</label>
              <input
                type="text"
                required
                value={driveRole}
                onChange={(e) => setDriveRole(e.target.value)}
                placeholder="Software Development Engineer"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg font-semibold shadow-xs"
            >
              Create Drive
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD CANDIDATE MODAL */}
      <Modal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title="Add Candidate to Queue"
        subtitle="Register an applicant for the placement drive"
      >
        <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              placeholder="e.g. Liam Sterling"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={candEmail}
              onChange={(e) => setCandEmail(e.target.value)}
              placeholder="candidate@university.edu"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Applied Role</label>
            <input
              type="text"
              value={candRole}
              onChange={(e) => setCandRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCandidateModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold shadow-xs"
            >
              Add Candidate
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD INTERVIEWER MODAL */}
      <Modal
        isOpen={isInterviewerModalOpen}
        onClose={() => setIsInterviewerModalOpen(false)}
        title="Add Faculty Interviewer"
        subtitle="Onboard a technical or executive panelist"
      >
        <form onSubmit={handleAddInterviewer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interviewer Name *</label>
            <input
              type="text"
              required
              value={intName}
              onChange={(e) => setIntName(e.target.value)}
              placeholder="e.g. Dr. Nathan Cross"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={intEmail}
              onChange={(e) => setIntEmail(e.target.value)}
              placeholder="faculty@university.edu"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expertise / Skills (comma separated)</label>
            <input
              type="text"
              value={intSkills}
              onChange={(e) => setIntSkills(e.target.value)}
              placeholder="Go, Kubernetes, Cloud Architecture"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInterviewerModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold shadow-xs"
            >
              Add Interviewer
            </button>
          </div>
        </form>
      </Modal>

      {/* INTERVIEW DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedInterviewModal)}
        onClose={() => setSelectedInterviewModal(null)}
        title={selectedInterviewModal?.candidateName || 'Session Details'}
        subtitle={selectedInterviewModal?.roundTitle}
      >
        {selectedInterviewModal && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-base font-bold text-slate-900">{selectedInterviewModal.candidateName}</div>
              <div className="text-slate-500">{selectedInterviewModal.candidateRole}</div>
              <div className="text-indigo-600 font-mono text-[11px] font-semibold mt-1">
                {selectedInterviewModal.date} · {selectedInterviewModal.startTime}–{selectedInterviewModal.endTime}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Faculty Panel</span>
                <span className="font-bold text-slate-800">{selectedInterviewModal.interviewerNames?.join(', ')}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Assigned Room</span>
                <span className="font-bold text-slate-800">{selectedInterviewModal.roomName}</span>
              </div>
            </div>

            {selectedInterviewModal.conflictReason && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 font-sans">
                <div className="font-bold">Conflict Warning</div>
                <div className="text-xs mt-0.5">{selectedInterviewModal.conflictReason}</div>
              </div>
            )}

            {selectedInterviewModal.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">Prep Directives</span>
                <p className="leading-relaxed font-sans">{selectedInterviewModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
