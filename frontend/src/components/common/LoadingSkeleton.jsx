import React from 'react';

export default function LoadingSkeleton({ rows = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-subtle p-6 animate-pulse ${className}`}>
      <div className="h-5 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/6" />
            <div className="h-4 bg-slate-100 rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
