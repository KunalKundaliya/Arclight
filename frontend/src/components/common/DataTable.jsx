import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick = null,
  emptyMessage = 'No records found matching your filters.',
  emptyIcon = null,
  isLoading = false,
  className = ''
}) {
  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-8">
        <EmptyState title="No entries found" description={emptyMessage} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => (
              <tr
                key={row[keyField] || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key || colIndex}
                    className={`px-5 py-4 align-middle ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3.5 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>Showing {data.length} entries</span>
        <span className="font-mono text-[11px] text-slate-400">Arclight Workspace</span>
      </div>
    </div>
  );
}
