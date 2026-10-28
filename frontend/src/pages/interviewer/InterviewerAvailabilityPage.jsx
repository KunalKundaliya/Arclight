import React, { useState } from 'react';
import { Clock, Check, Save, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function InterviewerAvailabilityPage() {
  const { showToast } = useToast();
  const [interviewers, setInterviewers] = useState(() => storageService.getInterviewers());
  
  // Current interviewer is Dr. Evelyn Voss ('int-01')
  const currentInterviewer = interviewers.find(i => i.id === 'int-01') || interviewers[0];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Local state for weekly slots
  const [availability, setAvailability] = useState(() => {
    return currentInterviewer.weeklyAvailability || {
      Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      Tuesday: [],
      Wednesday: ['10:00', '11:00', '13:00', '14:00', '16:00'],
      Thursday: [],
      Friday: ['09:00', '10:00', '11:00', '14:00']
    };
  });

  const [dailyCap, setDailyCap] = useState(currentInterviewer.maxInterviewsPerDay || 3);

  const toggleSlot = (day, time) => {
    setAvailability(prev => {
      const currentDaySlots = prev[day] || [];
      const exists = currentDaySlots.includes(time);
      const updatedDaySlots = exists
        ? currentDaySlots.filter(t => t !== time)
        : [...currentDaySlots, time];

      return {
        ...prev,
        [day]: updatedDaySlots
      };
    });
  };

  const handleSave = () => {
    const updated = {
      ...currentInterviewer,
      weeklyAvailability: availability,
      maxInterviewsPerDay: Number(dailyCap)
    };
    storageService.saveInterviewer(updated);
    showToast('Weekly availability rules updated! CSP solver will respect new time domains.', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Availability Editor"
        subtitle="Specify open time slots and maximum daily session caps to guide the constraint satisfaction solver"
        breadcrumbs={[
          { label: 'Interviewer', to: '/interviewer' },
          { label: 'Availability' }
        ]}
        actions={
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Availability</span>
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-6">
        {/* Settings row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Evaluation Workload Parameters</h4>
            <p className="text-xs text-slate-500">Prevent interviewer fatigue and ensure adequate prep time</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <label className="font-semibold text-slate-700">Max Interviews / Day:</label>
            <select
              value={dailyCap}
              onChange={(e) => setDailyCap(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-indigo-700"
            >
              <option value={1}>1 Session Max</option>
              <option value={2}>2 Sessions Max</option>
              <option value={3}>3 Sessions Max (Standard)</option>
              <option value={4}>4 Sessions Max</option>
            </select>
          </div>
        </div>

        {/* Matrix Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">Weekly Schedule Matrix (Click slot to toggle):</span>
            <div className="flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                Available for CSP Matching
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
                Unavailable / Busy
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-2 border-r border-slate-200 w-24">TIME</th>
                  {days.map(day => (
                    <th key={day} className="py-3 px-2 border-r border-slate-200 last:border-0 font-semibold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {times.map(time => (
                  <tr key={time}>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 bg-slate-50/50 border-r border-slate-200 font-medium">
                      {time}
                    </td>
                    {days.map(day => {
                      const isAvailable = (availability[day] || []).includes(time);
                      return (
                        <td
                          key={day}
                          onClick={() => toggleSlot(day, time)}
                          className={`py-2 px-2 border-r border-slate-100 last:border-0 cursor-pointer transition-all select-none ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold'
                              : 'bg-white text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Available
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>When the coordinator runs the CSP solver, only highlighted slots will be evaluated for your panel.</span>
          </div>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-2xs"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
