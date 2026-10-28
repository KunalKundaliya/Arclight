import React from 'react';

export default function ChartContainer({
  title,
  subtitle,
  actions = null,
  children,
  className = ''
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
