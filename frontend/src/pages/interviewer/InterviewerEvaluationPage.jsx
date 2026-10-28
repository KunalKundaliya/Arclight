import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Star,
  CheckCircle2,
  ChevronLeft,
  Save,
  Send,
  AlertCircle,
  Award
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function InterviewerEvaluationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const evaluations = storageService.getEvaluations();
  const existing = evaluations.find(e => e.id === id) || evaluations[2]; // fallback to draft eval

  // Rubric state
  const [technicalKnowledge, setTechnicalKnowledge] = useState(existing.rubric?.technicalKnowledge || 4.5);
  const [problemSolving, setProblemSolving] = useState(existing.rubric?.problemSolving || 4.7);
  const [codeQuality, setCodeQuality] = useState(existing.rubric?.codeQuality || 4.6);
  const [communication, setCommunication] = useState(existing.rubric?.communication || 4.8);

  const [recommendation, setRecommendation] = useState(existing.recommendation || 'Strong Hire');
  const [strengths, setStrengths] = useState(existing.strengths || 'Excellent understanding of distributed storage consensus and Raft log replication primitives.');
  const [growthAreas, setGrowthAreas] = useState(existing.growthAreas || 'Could explore more edge-case network partition behaviors without interviewer nudging.');
  const [summary, setSummary] = useState(existing.summary || 'Outstanding candidate. Strong recommendation to extend an offer.');

  // Weighted total score calculation out of 100
  const avg = (Number(technicalKnowledge) + Number(problemSolving) + Number(codeQuality) + Number(communication)) / 4;
  const calculatedScore = Math.round((avg / 5) * 100);

  const handleSubmit = (e) => {
    e.preventDefault();

    const evalPayload = {
      ...existing,
      totalScore: calculatedScore,
      recommendation,
      status: 'Completed',
      rubric: {
        technicalKnowledge: Number(technicalKnowledge),
        problemSolving: Number(problemSolving),
        codeQuality: Number(codeQuality),
        communication: Number(communication),
      },
      strengths,
      growthAreas,
      summary
    };

    storageService.submitEvaluation(evalPayload);
    showToast(`Evaluation scorecard submitted! Candidate score: ${calculatedScore}/100.`, 'success', 'Scorecard Recorded');
    navigate('/interviewer');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/interviewer" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      <PageHeader
        title={`Evaluation Scorecard: ${existing.candidateName}`}
        subtitle={`Candidate Evaluation for ${existing.round} • Evaluator: Dr. Evelyn Voss`}
        breadcrumbs={[
          { label: 'Interviewer', to: '/interviewer' },
          { label: 'Evaluations' },
          { label: existing.candidateName }
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Info Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Target Candidate</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{existing.candidateName}</h3>
            <div className="text-xs text-slate-500">{existing.role} • Round: {existing.round}</div>
          </div>

          <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 p-3 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Computed Composite</span>
              <span className="text-2xl font-black text-indigo-900 font-mono">{calculatedScore} / 100</span>
            </div>
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        {/* Rubric Matrix Sliders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-base font-bold text-slate-900">Standardized Rubric Scores</h4>
            <p className="text-xs text-slate-500">Rate candidate performance on a 1.0 to 5.0 scale</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* 1. Tech Knowledge */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Technical Knowledge & Depth</span>
                <span className="text-indigo-600 font-mono text-sm">{technicalKnowledge} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={technicalKnowledge}
                onChange={(e) => setTechnicalKnowledge(e.target.value)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Mastery of language fundamentals, concurrency primitives, and hardware awareness.</p>
            </div>

            {/* 2. Problem Solving */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Problem Solving & Algorithmic Rigor</span>
                <span className="text-indigo-600 font-mono text-sm">{problemSolving} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={problemSolving}
                onChange={(e) => setProblemSolving(e.target.value)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Ability to decompose ambiguous challenges and navigate tradeoff spaces under pressure.</p>
            </div>

            {/* 3. Code Quality */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>System Architecture / Code Quality</span>
                <span className="text-indigo-600 font-mono text-sm">{codeQuality} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={codeQuality}
                onChange={(e) => setCodeQuality(e.target.value)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Modularity, testability, defensive programming, and adherence to clean idioms.</p>
            </div>

            {/* 4. Communication */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Communication & Team Collaboration</span>
                <span className="text-indigo-600 font-mono text-sm">{communication} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={communication}
                onChange={(e) => setCommunication(e.target.value)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Clarity of explanation, receptiveness to hints, and intellectual humility.</p>
            </div>
          </div>
        </div>

        {/* Written Feedback & Final Verdict */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Hiring Recommendation Decision *</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 text-sm border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Strong Hire">Strong Hire (Fast Track)</option>
              <option value="Hire">Hire</option>
              <option value="Leaning No">Leaning No</option>
              <option value="No Hire">No Hire (Does Not Meet Bar)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Candidate Strengths</label>
            <textarea
              rows={2}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              placeholder="Highlight standout performance moments..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Growth & Risk Areas</label>
            <textarea
              rows={2}
              value={growthAreas}
              onChange={(e) => setGrowthAreas(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              placeholder="Areas where candidate struggled or needs mentoring..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Comprehensive Evaluator Summary *</label>
            <textarea
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              placeholder="Synthesize overall assessment for the hiring committee..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/interviewer')}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>Submit Official Evaluation</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
