import React from 'react';

const statusConfig = {
  // Drive & General Statuses
  Active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Draft: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Completed: { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  
  // Candidate / Interview Statuses
  Scheduled: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  Passed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Failed: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'In Review': { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  'Awaiting Evaluation': { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'In Progress': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse', dot: 'bg-indigo-500' },
  'Conflict Detected': { bg: 'bg-red-50 text-red-700 border-red-300 font-semibold', dot: 'bg-red-500' },
  Cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },

  // Availability / Room Statuses
  Available: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Busy: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'On Leave': { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  Occupied: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  Maintenance: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

// Round Badge Colors
const roundConfig = {
  Coding: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Technical: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  HR: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function StatusBadge({ status, type = 'status', className = '' }) {
  if (type === 'round') {
    const style = roundConfig[status] || 'bg-slate-50 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
        {status}
      </span>
    );
  }

  const conf = statusConfig[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {status}
    </span>
  );
}
