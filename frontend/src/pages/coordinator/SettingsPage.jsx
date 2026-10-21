import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Clock,
  Bell,
  Sliders,
  CheckCircle2,
  Save,
  RotateCcw,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(() => storageService.getSettings());

  const handleSave = (e) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    showToast('Platform preferences successfully saved to local workspace.', 'success', 'Settings Synchronized');
  };

  const handleReset = () => {
    storageService.resetAll();
    showToast('Preferences and mock databases restored to initial defaults.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform & Scheduling Settings"
        subtitle="Configure organization metadata, default CSP constraint boundaries, buffer policies, and communication channels"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Settings' }
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Organization Profile</h3>
              <p className="text-xs text-slate-500">Global enterprise identity and candidate branding domain</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Domain</label>
              <input
                type="text"
                value={settings.orgDomain}
                onChange={(e) => setSettings({ ...settings, orgDomain: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Scheduling Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">CSP Scheduling Parameters & Thresholds</h3>
              <p className="text-xs text-slate-500">Heuristic constraints used by the automated interview generator</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Interview Duration</label>
              <select
                value={settings.defaultDuration}
                onChange={(e) => setSettings({ ...settings, defaultDuration: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes (Deep Dive)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inter-Interview Buffer Time</label>
              <select
                value={settings.bufferMinutes}
                onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Organization Timezone</label>
              <select
                value={settings.timeZone}
                onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="America/New_York (UTC-4)">America/New_York (UTC-4)</option>
                <option value="America/Los_Angeles (UTC-7)">America/Los_Angeles (UTC-7)</option>
                <option value="Europe/London (UTC+1)">Europe/London (UTC+1)</option>
                <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
                <option value="Asia/Kolkata (UTC+5:30)">Asia/Kolkata (UTC+5:30)</option>
              </select>
            </div>
          </div>

          {/* Working hours */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Daily Window Start</label>
              <input
                type="time"
                value={settings.workingHoursStart}
                onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Daily Window End</label>
              <input
                type="time"
                value={settings.workingHoursEnd}
                onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Notification & Automation Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Notification & Automation Preferences</h3>
              <p className="text-xs text-slate-500">Real-time alerts, auto-resolution heuristics, and sync channels</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoResolveMinorConflicts}
                onChange={(e) => setSettings({ ...settings, autoResolveMinorConflicts: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Automated Minor Conflict Shifting</span>
                <span className="text-slate-500">Allow CSP solver to auto-shift overlapping slots by ±15 minutes if compatible</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Candidate Email Confirmations</span>
                <span className="text-slate-500">Simulate instant calendar invites upon candidate slot self-booking</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.slackIntegration}
                onChange={(e) => setSettings({ ...settings, slackIntegration: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Interviewer Panel Slack Reminders</span>
                <span className="text-slate-500">Send direct notifications 10 minutes prior to trial session kick-off</span>
              </div>
            </label>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Platform Data to Defaults</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
