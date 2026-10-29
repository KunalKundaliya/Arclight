import React from 'react';
import { Bell, Calendar, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

export default function CandidateNotificationsPage() {
  const notifications = [
    {
      id: 'cand-notif-1',
      title: 'Interview Slot Confirmed',
      message: 'System Architecture round successfully locked for Oct 22, 10:00 AM with Dr. Evelyn Voss.',
      timestamp: '1 hour ago',
      isRead: false
    },
    {
      id: 'cand-notif-2',
      title: 'Coding Challenge Score Posted',
      message: 'Congratulations! Your score for Round 1 was 94/100 (Top 5%). You have advanced to Round 2.',
      timestamp: '3 days ago',
      isRead: true
    },
    {
      id: 'cand-notif-3',
      title: 'Application Intake Received',
      message: 'Your profile has been admitted into the Apex Dynamics · Fall 2026 candidate pool.',
      timestamp: '5 days ago',
      isRead: true
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Notifications"
        subtitle="Important updates regarding slot confirmations, score releases, and interview reminders"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Notifications' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {notifications.map((n) => (
          <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors text-xs">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                <span className="text-[11px] text-slate-400 font-mono">{n.timestamp}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
