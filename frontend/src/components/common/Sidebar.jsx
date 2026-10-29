import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ChevronDown,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { currentRole, user, switchRole } = useAuth();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  // Streamlined, high-impact core navigation
  const coordinatorLinks = [
    { to: '/coordinator', label: 'Overview', end: true, showArrow: true },
    { to: '/coordinator/drives', label: 'Placement drives' },
    { to: '/coordinator/scheduler', label: 'AI scheduler & timetable' },
    { to: '/coordinator/candidates', label: 'Candidates pipeline' },
    { to: '/coordinator/interviewers', label: 'Interviewers & panels' },
    { to: '/coordinator/notifications', label: 'Notifications' },
  ];

  const interviewerLinks = [
    { to: '/interviewer', label: 'Overview', end: true, showArrow: true },
    { to: '/interviewer/calendar', label: 'My schedule' },
    { to: '/interviewer/availability', label: 'Weekly availability' },
    { to: '/interviewer/notifications', label: 'Notifications' },
  ];

  const candidateLinks = [
    { to: '/candidate', label: 'My dashboard', end: true, showArrow: true },
    { to: '/candidate/book/round-101', label: 'Self-book a slot' },
    { to: '/candidate/notifications', label: 'Notifications' },
  ];

  let links = coordinatorLinks;
  let workspaceTitle = 'Webster 2026';
  let workspaceSubtitle = 'Coordinator workspace';

  if (currentRole === ROLES.INTERVIEWER) {
    links = interviewerLinks;
    workspaceTitle = 'Webster Evaluation Panel';
    workspaceSubtitle = 'Webster 2026 Placement Drive';
  } else if (currentRole === ROLES.CANDIDATE) {
    links = candidateLinks;
    workspaceTitle = 'Webster Candidate Portal';
    workspaceSubtitle = 'Webster 2026 Placement Drive';
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Arclight Brand Logo at top matching new visual identity */}
          <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800/70">
            <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:text-indigo-200 transition-colors">
              <div className="w-6 h-6 flex items-center justify-center text-[#6366f1]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                  <line x1="6" y1="19" x2="10" y2="5" />
                  <line x1="12" y1="19" x2="16" y2="5" />
                  <line x1="18" y1="19" x2="22" y2="5" />
                </svg>
              </div>
              <span className="font-bold tracking-tight">Arclight</span>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher Header */}
          <div className="px-6 pt-5 pb-3">
            <div
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="cursor-pointer group select-none"
            >
              <div className="flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                <span>{workspaceTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
              </div>
              <div className="text-xs text-slate-400 font-normal mt-0.5">
                {workspaceSubtitle}
              </div>
            </div>

            {/* Quick role popover if workspace menu clicked */}
            {workspaceMenuOpen && (
              <div className="mt-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1 shadow-lg">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Switch Workspace</div>
                <button
                  onClick={() => { switchRole(ROLES.COORDINATOR); setWorkspaceMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg ${currentRole === ROLES.COORDINATOR ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-700 text-slate-300'}`}
                >
                  Coordinator (Maya Chen)
                </button>
                <button
                  onClick={() => { switchRole(ROLES.INTERVIEWER); setWorkspaceMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg ${currentRole === ROLES.INTERVIEWER ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-700 text-slate-300'}`}
                >
                  Interviewer (Priya Nair)
                </button>
                <button
                  onClick={() => { switchRole(ROLES.CANDIDATE); setWorkspaceMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg ${currentRole === ROLES.CANDIDATE ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-700 text-slate-300'}`}
                >
                  Candidate (Aanya Shah)
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links List */}
          <div className="px-4 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#312e81] text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.label}</span>
                    {isActive && link.showArrow && (
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-300" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="p-6 border-t border-slate-800/70 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.avatar || 'MC'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white leading-tight truncate">
              {user?.name || 'Maya Chen'}
            </div>
            <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 truncate">
              {currentRole === ROLES.COORDINATOR ? 'Coordinator · ArcLight' : currentRole === ROLES.INTERVIEWER ? 'Panel Lead · Webster 2026' : 'Candidate · Webster 2026'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
