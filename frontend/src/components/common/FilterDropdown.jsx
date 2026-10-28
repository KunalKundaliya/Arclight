import React from 'react';
import { Filter } from 'lucide-react';

export default function FilterDropdown({
  label,
  value,
  onChange,
  options = [],
  icon: Icon = Filter,
  className = ''
}) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {Icon && (
        <Icon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-xs ${
          Icon ? 'pl-9' : 'pl-3'
        }`}
      >
        {label && <option value="all">All {label}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const name = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {name}
            </option>
          );
        })}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
