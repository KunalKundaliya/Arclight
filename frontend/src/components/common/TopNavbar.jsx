import React, { useState } from 'react';
import { Search, Moon, RotateCcw, LogOut, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storageService } from '../../services/storageService';

export default function TopNavbar({ onMenuClick }) {
  const { currentRole, user, switchRole, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleResetData = () => {
    storageService.resetAll();
    showToast('Demo data reset to initial Webster 2026 state.', 'success');
    setUserMenuOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleSwitchPersona = (role) => {
    switchRole(role);
    setUserMenuOpen(false);
    showToast(`Switched persona to ${role}`, 'info');
    if (role === ROLES.COORDINATOR) navigate('/coordinator');
    else if (role === ROLES.INTERVIEWER) navigate('/interviewer');
    else if (role === ROLES.CANDIDATE) navigate('/candidate');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
      {/* Search Input with ⌘ K badge matching Screenshot 2 */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, drives, interviews..."
            className="w-full pl-9 pr-14 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right side items: VISUAL CONCEPT · DEMO DATA, Moon icon, Avatar */}
      <div className="flex items-center gap-5">
        <div className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
          VISUAL CONCEPT · DEMO DATA
        </div>

        {/* Theme Moon Icon */}
        <button
          onClick={() => showToast('Dark mode simulation toggled', 'info')}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Toggle theme"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* User initials circle with dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center hover:ring-2 hover:ring-indigo-500/30 transition-all cursor-pointer"
            title="User Profile & Settings"
          >
            {user?.avatar || 'MC'}
          </button>

          {/* User Popover Menu */}
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs"
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
              </div>

              <div className="p-1 space-y-0.5">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Switch Persona</div>
                <button
                  onClick={() => handleSwitchPersona(ROLES.COORDINATOR)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                    currentRole === ROLES.COORDINATOR ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Coordinator (Maya Chen)</span>
                  {currentRole === ROLES.COORDINATOR && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleSwitchPersona(ROLES.INTERVIEWER)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                    currentRole === ROLES.INTERVIEWER ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Interviewer (Priya Nair)</span>
                  {currentRole === ROLES.INTERVIEWER && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleSwitchPersona(ROLES.CANDIDATE)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                    currentRole === ROLES.CANDIDATE ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Candidate (Aanya Shah)</span>
                  {currentRole === ROLES.CANDIDATE && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="border-t border-slate-100 p-1">
                <button
                  onClick={handleResetData}
                  className="w-full text-left px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Demo Data</span>
                </button>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1.5 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
