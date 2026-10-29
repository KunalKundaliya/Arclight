import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  CalendarCheck,
  ChevronLeft,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { storageService } from '../../services/storageService';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { generateAvailableSlotsForDate } from '../../utils/slotGenerator';
import CalendarExportButtons from '../../components/common/CalendarExportButtons';

export default function CandidateBookingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const currentCandidateName = user?.name || 'Aanya Shah';
  const currentCandidateEmail = user?.email || 'aanya.shah@webster.edu';

  const [selectedDate, setSelectedDate] = useState('2026-10-26');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live state from PostgreSQL / storage
  const [interviewers, setInterviewers] = useState(() => storageService.getInterviewers());
  const [rooms, setRooms] = useState(() => storageService.getRooms());
  const [interviews, setInterviews] = useState(() => storageService.getInterviews());

  // Hydrate fresh availability from backend
  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.getInterviewers().catch(() => null),
      apiClient.getRooms().catch(() => null),
      apiClient.getInterviews().catch(() => null)
    ]).then(([intRes, rmRes, intvRes]) => {
      if (!mounted) return;
      if (intRes?.data) setInterviewers(intRes.data);
      if (rmRes?.data) setRooms(rmRes.data);
      if (intvRes?.data) setInterviews(intvRes.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const availableDates = [
    { date: '2026-10-26', day: 'Mon', label: 'Oct 26' },
    { date: '2026-10-27', day: 'Tue', label: 'Oct 27' },
    { date: '2026-10-28', day: 'Wed', label: 'Oct 28' },
    { date: '2026-10-29', day: 'Thu', label: 'Oct 29' },
    { date: '2026-10-30', day: 'Fri', label: 'Oct 30' },
  ];

  // Dynamic slot computation for selected date
  const currentSlots = useMemo(() => {
    return generateAvailableSlotsForDate({
      date: selectedDate,
      interviewers,
      rooms,
      existingInterviews: interviews,
      roundTitle: 'System Architecture & Fault Tolerance'
    });
  }, [selectedDate, interviewers, rooms, interviews]);

  // Dynamic slot count for date pills
  const getSlotCountForDate = (date) => {
    return generateAvailableSlotsForDate({
      date,
      interviewers,
      rooms,
      existingInterviews: interviews,
      roundTitle: 'System Architecture & Fault Tolerance'
    }).length;
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);

    // Create new interview entry
    const newInterview = {
      id: `intv-selfbook-${Date.now()}`,
      candidateId: user?.id || 'cand-01',
      candidateName: currentCandidateName,
      candidateEmail: currentCandidateEmail,
      candidateRole: 'Software Development Engineer',
      driveId: 'drv-101',
      interviewerNames: selectedSlot.interviewers,
      interviewerIds: selectedSlot.interviewerIds || ['int-01'],
      roomId: selectedSlot.roomId || 'room-03',
      roomName: selectedSlot.room,
      roundType: 'Technical',
      roundTitle: selectedSlot.roundTitle,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      duration: selectedSlot.duration,
      status: 'Scheduled',
      evaluationStatus: 'Pending',
      meetingUrl: 'https://meet.arclight.io/apex-interview-selfbook',
      notes: 'Candidate self-booked slot via intelligent scheduling portal.'
    };

    try {
      storageService.saveInterview(newInterview);
      await apiClient.createInterview(newInterview).catch((err) => {
        console.warn('Backend interview booking sync warning:', err.message);
      });

      setInterviews((prev) => [...prev, newInterview]);
      setIsConfirmModalOpen(false);
      setIsBooked(true);
      showToast('Interview confirmed! Calendar invite and sandbox link generated.', 'success', 'Booking Confirmed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/candidate" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Candidate Portal
        </Link>
      </div>

      <PageHeader
        title="Candidate Self-Booking Portal"
        subtitle="Select your preferred time slot for Round 2: System Architecture & Fault Tolerance"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Self-Booking' }
        ]}
      />

      {/* Info notice about demo self-booking */}
      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block">Intelligent Slot Availability:</span>
          All open slots are automatically verified against interviewer schedules and room availability with zero scheduling conflicts.
        </div>
      </div>

      {isBooked ? (
        /* Confirmation State */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-8 text-center space-y-4 max-w-xl mx-auto animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Your Interview Session is Confirmed!</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            You are scheduled for <strong>{selectedSlot?.roundTitle}</strong> on <strong>{selectedDate}</strong> at <strong>{selectedSlot?.startTime} - {selectedSlot?.endTime}</strong> with <strong>{selectedSlot?.interviewers.join(', ')}</strong>.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Date:</span>
              <span className="font-bold text-slate-800">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time:</span>
              <span className="font-bold text-indigo-600">{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Room:</span>
              <span className="font-bold text-slate-800">{selectedSlot?.room}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <CalendarExportButtons
              interview={{
                ...selectedSlot,
                date: selectedDate,
                candidateName: currentCandidateName
              }}
            />
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/candidate"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              to="/candidate/calendar"
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              View My Calendar
            </Link>
          </div>
        </div>
      ) : (
        /* Booking Workspace */
        <div className="space-y-6">
          {/* Date Selector Pills */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              1. Select Interview Date
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {availableDates.map(item => (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(item.date);
                    setSelectedSlot(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedDate === item.date
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className={`text-[11px] font-bold uppercase ${selectedDate === item.date ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {item.day}
                  </div>
                  <div className="text-base font-extrabold mt-0.5">{item.label}</div>
                  <div className={`text-[10px] mt-1 font-mono ${selectedDate === item.date ? 'text-indigo-200' : 'text-emerald-600 font-semibold'}`}>
                    {getSlotCountForDate(item.date)} Slots
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Slots Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                2. Choose Open Time Slot ({currentSlots.length} Verified Compatible Slots)
              </h4>
              <span className="text-xs font-mono text-slate-400">Duration: 60 Minutes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSlots.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                  No open slots currently available on this date that satisfy interviewer availability and room constraints. Please select another date above.
                </div>
              ) : (
                currentSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-xs relative ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-slate-50/50 hover:bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{slot.interviewers.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                        <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{slot.room}</span>
                      </div>
                    </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom confirmation action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {selectedSlot ? (
                  <span className="text-xs text-slate-700 font-medium">
                    Selected: <strong>{selectedDate} at {selectedSlot.startTime}</strong> with <strong>{selectedSlot.interviewers.join(', ')}</strong>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Select a time slot above to proceed with confirmation
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setIsConfirmModalOpen(true)}
                className={`px-6 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                  selectedSlot
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.02]'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Confirm This Time Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Interview Slot Booking"
        subtitle="Review your session details before committing"
      >
        {selectedSlot && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-2">
              <h4 className="font-extrabold text-sm text-indigo-900">{selectedSlot.roundTitle}</h4>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>Date: <strong>{selectedDate}</strong></div>
                <div>Time: <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong></div>
                <div>Room: <strong>{selectedSlot.room}</strong></div>
                <div>Faculty: <strong>{selectedSlot.interviewers.join(', ')}</strong></div>
              </div>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Upon clicking "Confirm & Lock Slot", your interview booking and calendar invitation details will be stored in your portal.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-xs"
              >
                Confirm & Lock Slot
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
