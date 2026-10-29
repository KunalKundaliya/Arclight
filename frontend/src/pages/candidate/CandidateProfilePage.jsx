import React from 'react';
import { User, Mail, Phone, Award, CheckCircle2, FileText, Briefcase } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { storageService } from '../../services/storageService';

export default function CandidateProfilePage() {
  const candidates = storageService.getCandidates();
  const candidate = candidates.find(c => c.id === 'cand-01') || candidates[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Application Profile"
        subtitle="Your verified profile details, tagged skills, and stage benchmarks"
        breadcrumbs={[
          { label: 'Candidate', to: '/candidate' },
          { label: 'Profile' }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
            {candidate.initials}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-extrabold text-slate-900">{candidate.name}</h3>
            <div className="text-sm text-indigo-600 font-semibold">{candidate.appliedRole}</div>
            <div className="text-xs text-slate-500 mt-0.5">{candidate.email} • {candidate.phone}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-emerald-900 text-xs font-bold text-center">
            <div className="text-[10px] text-emerald-700 uppercase">Composite Score</div>
            <div className="text-lg font-mono font-black">{candidate.score} / 100</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-2">Verified Skill Competencies</h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills?.map(skill => (
              <span key={skill} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Recruitment Drive</span>
            <div className="font-bold text-slate-900 text-sm mt-1">Apex Dynamics · Fall 2026</div>
            <div className="text-slate-500 mt-1">Apex Dynamics • Distributed Systems Track</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Application Status</span>
            <div className="font-bold text-emerald-600 text-sm mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active & Scheduled</span>
            </div>
            <div className="text-slate-500 mt-1">Stage 2: System Architecture</div>
          </div>
        </div>

        {candidate.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-bold block mb-1 text-slate-900">Coordinator Assessment Log</span>
            <p className="leading-relaxed">{candidate.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
