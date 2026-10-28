import React from 'react';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../utils/calendarExport';

export default function CalendarExportButtons({ interview, compact = false }) {
  if (!interview) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      <button
        type="button"
        onClick={() => downloadIcsFile(interview)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all hover:border-slate-300 hover:scale-[1.02]"
        title="Download standard .ics iCalendar file for Outlook, Apple Calendar, etc."
      >
        <Download className="w-3.5 h-3.5 text-indigo-600" />
        <span>Export (.ics)</span>
      </button>

      <a
        href={getGoogleCalendarUrl(interview)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-all hover:scale-[1.02]"
        title="Add directly to Google Calendar in new tab"
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
        <span>Google Calendar</span>
        <ExternalLink className="w-3 h-3 text-indigo-400" />
      </a>
    </div>
  );
}
