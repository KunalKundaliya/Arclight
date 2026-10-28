import React, { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Clock,
  User,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { storageService } from '../../services/storageService';
import { apiClient } from '../../services/apiClient';
import { useRealtime } from '../../context/RealtimeContext';
import CalendarExportButtons from '../../components/common/CalendarExportButtons';

// Timezone-safe date normalizer that handles YYYY-MM-DD, ISO timestamps, and Date objects
export function normalizeDate(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return val.slice(0, 10);
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val);
}

export default function MasterCalendarPage() {
  const [interviews, setInterviews] = useState(() => storageService.getInterviews());
  const [interviewers, setInterviewers] = useState(() => storageService.getInterviewers());
  const [rooms, setRooms] = useState(() => storageService.getRooms());
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Real-time synchronization hook (SSE)
  const { lastUpdated, isConnected } = useRealtime();

  // Live PostgreSQL sync on mount, manual trigger, or SSE broadcast
  const refreshLiveSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const [intRes, facRes, rmRes] = await Promise.all([
        apiClient.getInterviews().catch(() => null),
        apiClient.getInterviewers().catch(() => null),
        apiClient.getRooms().catch(() => null)
      ]);

      if (intRes?.data) setInterviews(intRes.data);
      if (facRes?.data) setInterviewers(facRes.data);
      if (rmRes?.data) setRooms(rmRes.data);
      setLastSyncTime(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch fresh data on mount
  useEffect(() => {
    refreshLiveSchedule();
  }, [refreshLiveSchedule]);

  // Auto-refresh when SSE broadcast signals a schedule change
  useEffect(() => {
    refreshLiveSchedule();
  }, [lastUpdated, refreshLiveSchedule]);

  // View state: 'month' | 'week' | 'day'
  const [viewMode, setViewMode] = useState('week');
  // currentDateIndex: 0 = Current Week (Oct 26 - Nov 1, 2026), 1 = Placement Week (Nov 2 - Nov 8, 2026)
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Filters
  const [roundFilter, setRoundFilter] = useState('all');
  const [interviewerFilter, setInterviewerFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Week days starting Oct 26, 2026 (Mon of current operational week)
  const baseDate = new Date(2026, 9, 26 + currentDateIndex * 7);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dateObj: d,
      dateString: `${year}-${month}-${day}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Resilient filtered interviews
  const filteredInterviews = interviews.filter(int => {
    const roundType = (int.roundType || '').toLowerCase();
    const matchesRound = roundFilter === 'all' || roundType.includes(roundFilter.toLowerCase());

    const intvNames = Array.isArray(int.interviewerNames)
      ? int.interviewerNames
      : [int.interviewerNames || ''];
    const matchesInterviewer = interviewerFilter === 'all' ||
      intvNames.some(n => String(n).toLowerCase().includes(interviewerFilter.toLowerCase()));

    const roomName = (int.roomName || '').toLowerCase();
    const matchesRoom = roomFilter === 'all' || roomName.includes(roomFilter.toLowerCase());

    return matchesRound && matchesInterviewer && matchesRoom;
  });

  // Color tokens per round
  const getRoundEventClasses = (roundType) => {
    const r = (roundType || '').toLowerCase();
    if (r.includes('coding')) {
      return 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100';
    }
    if (r.includes('tech') || r.includes('system') || r.includes('arch')) {
      return 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100';
    }
    if (r.includes('hr') || r.includes('bar') || r.includes('fit') || r.includes('lead')) {
      return 'bg-violet-50 border-violet-300 text-violet-900 hover:bg-violet-100';
    }
    return 'bg-slate-50 border-slate-300 text-slate-900 hover:bg-slate-100';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Schedule Calendar"
        subtitle="Unified calendar across all candidate interview slots, interview faculty schedules, and room availability"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Master Calendar' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Real-Time Sync Active' : 'Offline Mode'}
            </span>
            {lastSyncTime && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Synced at {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={refreshLiveSchedule}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all hover:border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Sync Live Schedule'}</span>
            </button>
          </div>
        }
      />

      {/* Calendar Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => setCurrentDateIndex(prev => prev - 1)}
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDateIndex(0)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                currentDateIndex === 0
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-white'
              }`}
              title="Current week (Oct 26 - Nov 1)"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDateIndex(prev => prev + 1)}
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDateIndex(1)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
              currentDateIndex === 1
                ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Placement Week (Nov 2–8)</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {weekDays[0].monthName} {weekDays[0].dayNumber} — {weekDays[6].monthName} {weekDays[6].dayNumber}, {weekDays[0].dateObj.getFullYear()}
            </span>
            {currentDateIndex === 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                This Week
              </span>
            )}
            {currentDateIndex === 1 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Placement Drive
              </span>
            )}
          </div>
        </div>

        {/* View Mode & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>

          <FilterDropdown
            label="Round"
            value={roundFilter}
            onChange={setRoundFilter}
            options={[
              { value: 'all', label: 'All Rounds' },
              { value: 'coding', label: 'Coding Challenge' },
              { value: 'technical', label: 'System Architecture' },
              { value: 'hr', label: 'Leadership / Bar Raiser' },
            ]}
          />

          <FilterDropdown
            label="Room"
            value={roomFilter}
            onChange={setRoomFilter}
            options={[
              { value: 'all', label: 'All Rooms' },
              { value: 'alpha', label: 'Room Alpha' },
              { value: 'c-201', label: 'Room C-201' },
              { value: 'c-202', label: 'Room C-202' },
              { value: 'c-203', label: 'Room C-203' },
              { value: 'cloud', label: 'Virtual Cloud' },
            ]}
          />
        </div>
      </div>

      {/* Round Color Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/90 shadow-subtle flex-wrap">
        <span className="font-semibold text-slate-700">Round Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          Coding Challenge
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          System Architecture / Technical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          Executive Bar Raiser & Cultural Fit
        </span>
        <span className="ml-auto text-[11px] font-mono text-slate-400">
          Showing {filteredInterviews.length} total scheduled interview sessions
        </span>
      </div>

      {/* Week Calendar Grid */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
            <div className="p-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200">
              TIME
            </div>
            {weekDays.map((d) => (
              <div key={d.dateString} className="p-3 text-center border-r border-slate-200 last:border-0">
                <div className="text-slate-400 font-medium text-[11px]">{d.dayName}</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">{d.dayNumber}</div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-slate-100">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[76px]">
                {/* Hour label */}
                <div className="p-2 text-right pr-3 font-mono text-[11px] text-slate-400 border-r border-slate-200 bg-slate-50/30">
                  {hour}
                </div>

                {/* Day cells */}
                {weekDays.map((d) => {
                  const cellEvents = filteredInterviews.filter(int => {
                    const intDate = normalizeDate(int.date);
                    const intHour = (int.startTime || '').slice(0, 2);
                    const cellHour = hour.slice(0, 2);
                    return intDate === d.dateString && intHour === cellHour;
                  });

                  return (
                    <div
                      key={d.dateString}
                      className="p-1 border-r border-slate-100 last:border-0 relative hover:bg-slate-50/50 transition-colors"
                    >
                      {cellEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all shadow-2xs mb-1 ${getRoundEventClasses(
                            evt.roundType
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-[11px] truncate">{evt.candidateName}</span>
                            <span className="text-[10px] font-mono text-slate-500">{evt.startTime}</span>
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{evt.roundTitle}</div>
                          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {Array.isArray(evt.interviewerNames) && evt.interviewerNames.length > 0
                              ? evt.interviewerNames.join(', ')
                              : (typeof evt.interviewerNames === 'string' && evt.interviewerNames ? evt.interviewerNames : 'Assigned Faculty')}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-900">
              Month Overview: {baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="text-xs text-slate-500 font-medium">
              Click any active date card to jump straight into its weekly schedule
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="font-bold text-slate-400 py-2">{day}</div>
            ))}
            {Array.from({ length: new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const count = filteredInterviews.filter(int => normalizeDate(int.date) === dateStr).length;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), dayNum);
                    const dayOfWeek = targetDate.getDay();
                    const diffToMon = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    const targetMon = new Date(baseDate.getFullYear(), baseDate.getMonth(), diffToMon);
                    const refMon = new Date(2026, 9, 26);
                    const diffWeeks = Math.round((targetMon - refMon) / (7 * 24 * 60 * 60 * 1000));
                    setCurrentDateIndex(diffWeeks);
                    setViewMode('week');
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer min-h-[72px] text-left flex flex-col justify-between ${
                    count > 0 ? 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-slate-700">{dayNum}</span>
                  {count > 0 ? (
                    <span className="text-[10px] font-semibold bg-indigo-600 text-white px-1.5 py-0.5 rounded-md inline-block text-center shadow-xs">
                      {count} {count === 1 ? 'Session' : 'Sessions'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-mono">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-900">
              Day Schedule: {weekDays[0].dayName}, {weekDays[0].monthName} {weekDays[0].dayNumber}, {weekDays[0].dateObj.getFullYear()}
            </h4>
            <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              {filteredInterviews.filter(int => normalizeDate(int.date) === weekDays[0].dateString).length} Sessions Today
            </span>
          </div>
          <div className="space-y-3">
            {filteredInterviews
              .filter(int => normalizeDate(int.date) === weekDays[0].dateString)
              .map(evt => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${getRoundEventClasses(evt.roundType)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-sm text-slate-900">{evt.candidateName} — {evt.candidateRole}</h5>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/70 border border-current">
                      {evt.startTime} - {evt.endTime}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    {evt.roundTitle} • Room: <span className="font-semibold text-slate-800">{evt.roomName}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Interviewers:{' '}
                    <span className="font-medium text-slate-700">
                      {Array.isArray(evt.interviewerNames) && evt.interviewerNames.length > 0
                        ? evt.interviewerNames.join(', ')
                        : (evt.interviewerNames || 'Assigned Faculty')}
                    </span>
                  </div>
                </div>
              ))}
            {filteredInterviews.filter(int => normalizeDate(int.date) === weekDays[0].dateString).length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                No interviews scheduled for this date. Use the navigation buttons above or switch to Week view.
              </div>
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Scheduled Interview Session"
        subtitle={selectedEvent?.roundTitle}
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Candidate</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">{selectedEvent.candidateName}</div>
                <div className="text-slate-500">{selectedEvent.candidateRole}</div>
              </div>
              <StatusBadge status={selectedEvent.roundType} type="round" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Date & Time
                </span>
                <div className="font-bold text-slate-800 mt-1 font-mono text-xs">
                  {normalizeDate(selectedEvent.date)}
                </div>
                <div className="text-indigo-600 font-mono font-medium text-xs mt-0.5">
                  {selectedEvent.startTime} - {selectedEvent.endTime} ({selectedEvent.duration})
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Assigned Room / Hub
                </span>
                <div className="font-semibold text-slate-800 mt-1">{selectedEvent.roomName}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5" /> Interview Panel Faculty
              </span>
              <div className="font-semibold text-slate-900">
                {Array.isArray(selectedEvent.interviewerNames) && selectedEvent.interviewerNames.length > 0
                  ? selectedEvent.interviewerNames.join(', ')
                  : (selectedEvent.interviewerNames || 'Assigned Faculty')}
              </div>
            </div>

            {selectedEvent.meetingUrl && (
              <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-indigo-950 block">Virtual Meeting Link</span>
                  <span className="text-[11px] text-indigo-700 font-mono">{selectedEvent.meetingUrl}</span>
                </div>
                <a
                  href={selectedEvent.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <span>Join Meeting</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block text-xs">Calendar Synchronization</span>
                <span className="text-[11px] text-slate-500">Add this session to personal or enterprise calendars</span>
              </div>
              <CalendarExportButtons interview={selectedEvent} />
            </div>

            {selectedEvent.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">Preparation Directives</span>
                <p className="leading-relaxed">{selectedEvent.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
