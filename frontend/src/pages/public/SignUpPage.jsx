import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Users,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Building2,
  GraduationCap
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function SignUpPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Selected registration role
  const [role, setRole] = useState(ROLES.CANDIDATE);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Role-specific inputs
  const [appliedRole, setAppliedRole] = useState('Software Development Engineer');
  const [organization, setOrganization] = useState('Webster University');
  const [skills, setSkills] = useState('Algorithms, Distributed Systems, React, Go');
  const [phone, setPhone] = useState('+1 (555) 392-1049');
  const [title, setTitle] = useState('Senior Systems Architect');
  const [department, setDepartment] = useState('Engineering & Systems');
  const [maxInterviewsPerDay, setMaxInterviewsPerDay] = useState(3);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter your full name.', 'warning');
      return;
    }

    if (!email.trim()) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    if (!agreedToTerms) {
      showToast('Please accept the placement schedule terms to proceed.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        appliedRole: role === ROLES.CANDIDATE ? appliedRole : undefined,
        organization: organization.trim(),
        skills: skills.trim(),
        phone: role === ROLES.CANDIDATE ? phone.trim() : undefined,
        title: role === ROLES.INTERVIEWER ? title.trim() : undefined,
        department: department.trim(),
        maxInterviewsPerDay: role === ROLES.INTERVIEWER ? Number(maxInterviewsPerDay) : undefined
      };

      const newUser = await register(payload);
      showToast(`Welcome aboard, ${newUser.name}! Your account is ready.`, 'success', 'Registration Complete');

      // Navigate to corresponding dashboard
      if (newUser.role === ROLES.COORDINATOR) navigate('/coordinator');
      else if (newUser.role === ROLES.INTERVIEWER) navigate('/interviewer');
      else navigate('/candidate');
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error', 'Sign Up Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[#FAFAFD]">
      <div className="w-full max-w-xl space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 flex items-center justify-center text-[#6366f1]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                <line x1="6" y1="19" x2="10" y2="5" />
                <line x1="12" y1="19" x2="16" y2="5" />
                <line x1="18" y1="19" x2="22" y2="5" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Arclight</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create your placement account</h2>
          <p className="text-sm text-slate-500">Join the conflict-free placement and scheduling workspace</p>
        </div>

        {/* Card Container */}
        <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          {/* 1. Role Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              1. Choose your account type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Candidate Option */}
              <button
                type="button"
                onClick={() => setRole(ROLES.CANDIDATE)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  role === ROLES.CANDIDATE
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${role === ROLES.CANDIDATE ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  {role === ROLES.CANDIDATE && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">Candidate</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Student / Applicant</div>
              </button>

              {/* Interviewer Option */}
              <button
                type="button"
                onClick={() => setRole(ROLES.INTERVIEWER)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  role === ROLES.INTERVIEWER
                    ? 'border-violet-500 bg-violet-50/70 ring-2 ring-violet-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${role === ROLES.INTERVIEWER ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  {role === ROLES.INTERVIEWER && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">Interviewer</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Faculty / Evaluator</div>
              </button>

              {/* Coordinator Option */}
              <button
                type="button"
                onClick={() => setRole(ROLES.COORDINATOR)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  role === ROLES.COORDINATOR
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${role === ROLES.COORDINATOR ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  {role === ROLES.COORDINATOR && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">Coordinator</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Placement Team</div>
              </button>
            </div>
          </div>

          {/* 2. Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder={role === ROLES.INTERVIEWER ? "e.g., Dr. Marcus Vance" : "e.g., Kabir Sharma"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email address *</label>
                <input
                  type="email"
                  required
                  placeholder={role === ROLES.CANDIDATE ? "student@webster.edu" : "name@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Dynamic fields based on chosen role */}
            {role === ROLES.CANDIDATE && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <label className="block text-xs font-medium text-emerald-950 mb-1">Target Job Role</label>
                  <input
                    type="text"
                    value={appliedRole}
                    onChange={(e) => setAppliedRole(e.target.value)}
                    placeholder="e.g., Software Development Engineer"
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-950 mb-1">University / College</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Webster University"
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-emerald-950 mb-1">Technical Skills & Expertise</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., Python, C++, React, Docker, Distributed Systems"
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {role === ROLES.INTERVIEWER && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                <div>
                  <label className="block text-xs font-medium text-violet-950 mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Senior Systems Architect"
                    className="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-950 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Distributed Engineering"
                    className="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-950 mb-1">Max Daily Interviews (Cap)</label>
                  <select
                    value={maxInterviewsPerDay}
                    onChange={(e) => setMaxInterviewsPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value={2}>2 sessions / day</option>
                    <option value={3}>3 sessions / day (Standard)</option>
                    <option value={4}>4 sessions / day</option>
                    <option value={5}>5 sessions / day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-950 mb-1">Evaluation Focus</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., System Design, Concurrency, Algorithms"
                    className="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            )}

            {role === ROLES.COORDINATOR && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div>
                  <label className="block text-xs font-medium text-indigo-950 mb-1">Organization / Placement Cell</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Webster University Placement Cell"
                    className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-950 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Career Services & Industry Relations"
                    className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-[#4f46e5] rounded focus:ring-indigo-500 mt-0.5"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-slate-500 select-none cursor-pointer leading-relaxed">
                I agree to the automated placement coordination schedule and privacy terms.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-indigo-300 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:translate-y-[-0.5px] cursor-pointer"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account & Enter Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Already have an account?</span>
            <Link to="/login" className="font-semibold text-[#4f46e5] hover:underline flex items-center gap-1">
              <span>Sign In instead</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-[#4f46e5] transition-colors">
            ← Return to ArcLight Home
          </Link>
        </div>
      </div>
    </div>
  );
}
