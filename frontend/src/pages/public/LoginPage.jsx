import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck, Users, Briefcase } from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('maya.chen@arclight.io');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState(ROLES.COORDINATOR);

  const { switchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleStandardLogin = (e) => {
    e.preventDefault();
    switchRole(selectedRole);
    showToast(`Logged in successfully as ${selectedRole.toUpperCase()}`, 'success', 'Session Established');
    
    if (selectedRole === ROLES.COORDINATOR) navigate('/coordinator');
    else if (selectedRole === ROLES.INTERVIEWER) navigate('/interviewer');
    else if (selectedRole === ROLES.CANDIDATE) navigate('/candidate');
  };

  const handleQuickDemoEntry = (role) => {
    switchRole(role);
    showToast(`Entering ${role.toUpperCase()} Workspace (Demo)`, 'info');
    if (role === ROLES.COORDINATOR) navigate('/coordinator');
    else if (role === ROLES.INTERVIEWER) navigate('/interviewer');
    else if (role === ROLES.CANDIDATE) navigate('/candidate');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAFAFD]">
      <div className="w-full max-w-md">
        {/* Card Header matching ArcLight brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              A
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">ArcLight</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Webster 2026 Placement Workspace</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to coordinate candidate placement schedules</p>
        </div>

        {/* Demo Role Quick Launch Box */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-indigo-100 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4f46e5] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#4f46e5]" />
              Quick Demo Entry
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1-Click Launch</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Select a persona below to enter without credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoEntry(ROLES.COORDINATOR)}
              className="p-2.5 rounded-lg bg-[#eef2ff] hover:bg-[#e0e7ff] border border-[#c7d2fe] text-center transition-all group"
            >
              <Briefcase className="w-4 h-4 mx-auto text-[#4f46e5] mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-[#312e81]">Coordinator</div>
              <div className="text-[10px] text-[#4338ca]">Maya Chen</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoEntry(ROLES.INTERVIEWER)}
              className="p-2.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-center transition-all group"
            >
              <UserCheck className="w-4 h-4 mx-auto text-violet-600 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-violet-950">Panel Lead</div>
              <div className="text-[10px] text-violet-700">Priya Nair</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoEntry(ROLES.CANDIDATE)}
              className="p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition-all group"
            >
              <Users className="w-4 h-4 mx-auto text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-emerald-950">Candidate</div>
              <div className="text-[10px] text-emerald-700">Aanya Shah</div>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle">
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Persona</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={ROLES.COORDINATOR}>Placement Coordinator — Maya Chen</option>
                <option value={ROLES.INTERVIEWER}>Engineering Evaluator — Priya Nair</option>
                <option value={ROLES.CANDIDATE}>Applicant Candidate — Aanya Shah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => showToast('Use 1-click quick demo buttons above.', 'info')}
                  className="text-xs text-[#4f46e5] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#4f46e5] rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="ml-2 text-xs text-slate-500 select-none cursor-pointer">
                Remember this workstation for 30 days
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-[#4f46e5] transition-colors">
              ← Return to ArcLight Home
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          A visual product concept. Simulated AI solving and mocked calendar integration.
        </p>
      </div>
    </div>
  );
}
