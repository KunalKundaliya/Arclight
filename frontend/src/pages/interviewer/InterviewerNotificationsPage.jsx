import React from 'react';
import { Bell, Calendar, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

export default function InterviewerNotificationsPage() {
  const notifications = [
    {
      id: 'int-notif-1',
      title: 'Upcoming Session in 45 Minutes',
      message: 'System Architecture round with Soren Vance begins at 10:00 AM in Virtual Meeting Room 1.',
      timestamp: '15 mins ago',
      type: 'reminder'
    },
    {
      id: 'int-notif-2',
      title: 'Scorecard Reminder: Elena Rostova',
      message: 'Your rubric scorecard for yesterday\'s final round is awaiting submission.',
      timestamp: '2 hours ago',
      type: 'action'
    },
    {
      id: 'int-notif-3',
      title: 'Schedule Optimization Notice',
      message: 'The automated scheduler rebalanced panel distribution. Your Friday afternoon slot was released.',
      timestamp: '1 day ago',
      type: 'info'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviewer Notifications"
        subtitle="Schedule adjustments, panel assignments, and pending evaluation reminders"
        breadcrumbs={[
          { label: 'Interviewer', to: '/interviewer' },
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
