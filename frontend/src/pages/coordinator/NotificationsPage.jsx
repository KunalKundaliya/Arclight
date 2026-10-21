import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  Info,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(() => storageService.getNotifications());
  const [filter, setFilter] = useState('all');

  const handleMarkAsRead = (id) => {
    const updated = storageService.markAsRead(id);
    setNotifications(updated);
    showToast('Notification marked as read', 'info');
  };

  const handleMarkAllRead = () => {
    const updated = storageService.markAllAsRead();
    setNotifications(updated);
    showToast('All notifications marked as read', 'success');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'conflicts') return n.type === 'conflict';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'conflict':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'evaluation':
        return <ClipboardCheck className="w-5 h-5 text-violet-500" />;
      case 'schedule':
        return <CheckCheck className="w-5 h-5 text-indigo-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & System Logs"
        subtitle="Automated alerts for candidate self-bookings, CSP solver runs, double-booking warnings, and pending scorecards"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Notifications' }
        ]}
        actions={
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" />
            <span>Mark All as Read</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'unread' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
        <button
          onClick={() => setFilter('conflicts')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'conflicts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Conflicts ({notifications.filter(n => n.type === 'conflict').length})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
              notif.isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
            }`}
          >
            <div className="mt-0.5 p-2 rounded-xl bg-slate-100 border border-slate-200/70 shrink-0">
              {getIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm ${notif.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                    {notif.title}
                  </h4>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">{notif.timestamp}</span>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">{notif.message}</p>

              <div className="mt-2.5 flex items-center gap-3">
                {notif.link && (
                  <Link
                    to={notif.link}
                    className="font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[11px]"
                  >
                    <span>Inspect Target</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px]"
                  >
                    <Check className="w-3 h-3" />
                    <span>Dismiss</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications matching this category.
          </div>
        )}
      </div>
    </div>
  );
}
