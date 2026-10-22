import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  iconColor = 'text-indigo-600 bg-indigo-50 border-indigo-100',
  description,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-indigo-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${
              changeType === 'positive'
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                : changeType === 'negative'
                ? 'text-rose-700 bg-rose-50 border border-rose-100'
                : 'text-slate-600 bg-slate-50 border border-slate-200'
            }`}
          >
            {changeType === 'positive' ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : changeType === 'negative' ? (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            ) : null}
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-500 truncate">{description}</p>
      )}
    </div>
  );
}
