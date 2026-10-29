import React from 'react';
import { User, Mail, Award, Star, Clock, CheckCircle2, ShieldCheck, Briefcase } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { storageService } from '../../services/storageService';

export default function InterviewerProfilePage() {
  const interviewers = storageService.getInterviewers();
  const profile = interviewers.find(i => i.id === 'int-01') || interviewers[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviewer Faculty Profile"
        subtitle="Credentials, assigned domain rubrics, and evaluation benchmarks"
        breadcrumbs={[
          { label: 'Interviewer', to: '/interviewer' },
          { label: 'Profile' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-6">
        {/* Header Profile card */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-violet-600/30 shrink-0">
            {profile.initials}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-extrabold text-slate-900">{profile.name}</h3>
            <div className="text-sm text-indigo-600 font-semibold">{profile.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{profile.department} • {profile.email}</div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-amber-900 text-xs font-bold">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{profile.rating} / 5.0 Rating</span>
          </div>
        </div>

        {/* Competencies */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-2">Verified Assessment Domains</h4>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills?.map(skill => (
              <span key={skill} className="px-3 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Workload and Capacity rules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maximum Daily Cap</span>
            <div className="font-bold text-slate-900 text-base mt-1">{profile.maxInterviewsPerDay} Interviews / Day</div>
            <div className="text-slate-500 mt-1">Guarantees focus and prevents interviewer burnout</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Assigned Sessions</span>
            <div className="font-bold text-indigo-600 text-base mt-1">{profile.assignedInterviews} Sessions</div>
            <div className="text-slate-500 mt-1">Across Fall 2026 Apex Placement Drive</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty Standing</span>
            <div className="font-bold text-emerald-600 text-base mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Certified Bar Raiser</span>
            </div>
            <div className="text-slate-500 mt-1">Authorized for executive level trials</div>
          </div>
        </div>
      </div>
    </div>
  );
}
