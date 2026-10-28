import React, { useState } from 'react';
import { Plus, Search, Filter, Users, Mail, Phone, Edit2, Eye, Trash2, CheckCircle2, Award } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import DataTable from '../../components/common/DataTable';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function CandidatesPage() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState(() => storageService.getCandidates());
  const [drives] = useState(() => storageService.getDrives());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    appliedRole: 'Senior Distributed Systems Engineer',
    driveId: 'drv-101',
    skills: 'Go, Raft, Kubernetes',
    currentRound: 'System Architecture',
    stage: 'Technical',
    status: 'Scheduled',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      appliedRole: 'Senior Distributed Systems Engineer',
      driveId: 'drv-101',
      skills: 'Go, Raft, Kubernetes',
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Scheduled',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cand) => {
    setEditingCandidate(cand);
    setForm({
      name: cand.name,
      email: cand.email,
      phone: cand.phone || '',
      appliedRole: cand.appliedRole,
      driveId: cand.driveId,
      skills: (cand.skills || []).join(', '),
      currentRound: cand.currentRound,
      stage: cand.stage || 'Technical',
      status: cand.status,
      notes: cand.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Candidate name and email are required', 'warning');
      return;
    }

    const candData = {
      ...(editingCandidate || {}),
      name: form.name,
      email: form.email,
      phone: form.phone,
      appliedRole: form.appliedRole,
      driveId: form.driveId,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      currentRound: form.currentRound,
      stage: form.stage,
      status: form.status,
      notes: form.notes,
      score: editingCandidate ? editingCandidate.score : 85,
      appliedDate: editingCandidate ? editingCandidate.appliedDate : new Date().toISOString().split('T')[0]
    };

    const updated = storageService.saveCandidate(candData);
    setCandidates(updated);
    setIsAddModalOpen(false);
    showToast(
      editingCandidate ? 'Candidate updated successfully' : 'Candidate added to scheduling pool',
      'success'
    );
  };

  const handleDelete = () => {
    if (!candidateToDelete) return;
    const filtered = candidates.filter(c => c.id !== candidateToDelete.id);
    localStorage.setItem('aot_candidates', JSON.stringify(filtered));
    setCandidates(filtered);
    showToast(`Candidate ${candidateToDelete.name} removed from pool`, 'info');
    setCandidateToDelete(null);
  };

  // Filter logic
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.appliedRole.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesRound = roundFilter === 'all' || c.currentRound.toLowerCase().includes(roundFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesRound;
  });

  // Table Columns definition
  const columns = [
    {
      header: 'Candidate',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${row.avatarBg || 'bg-indigo-600'} text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
            {row.initials || row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setViewingCandidate(row)}>
              {row.name}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Applied Role & Drive',
      key: 'appliedRole',
      render: (_, row) => {
        const drive = drives.find(d => d.id === row.driveId);
        return (
          <div>
            <div className="font-medium text-slate-800">{row.appliedRole}</div>
            <div className="text-[11px] text-slate-400">{drive ? drive.name : 'Engineering Sprint'}</div>
          </div>
        );
      }
    },
    {
      header: 'Key Skills',
      key: 'skills',
      render: (skills) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {(skills || []).slice(0, 3).map(skill => (
            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {skill}
            </span>
          ))}
          {(skills || []).length > 3 && (
            <span className="text-[10px] px-1 py-0.5 text-slate-400">+{skills.length - 3}</span>
          )}
        </div>
      )
    },
    {
      header: 'Current Stage',
      key: 'currentRound',
      render: (_, row) => (
        <div>
          <StatusBadge status={row.stage || 'Technical'} type="round" />
          <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[140px]">{row.currentRound}</div>
        </div>
      )
    },
    {
      header: 'Status & Score',
      key: 'status',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          {row.score && (
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {row.score}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingCandidate(row);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Candidate"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCandidateToDelete(row);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Candidate"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Pool"
        subtitle="Manage candidate profiles, competency assessments, round progression, and interview scheduling statuses"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Candidates' }
        ]}
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by candidate name, email, or applied role..."
        />
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'passed', label: 'Passed' },
              { value: 'failed', label: 'Failed' },
              { value: 'in review', label: 'In Review' },
              { value: 'awaiting evaluation', label: 'Awaiting Evaluation' },
            ]}
          />
          <FilterDropdown
            label="Round"
            value={roundFilter}
            onChange={setRoundFilter}
            options={[
              { value: 'coding', label: 'Coding' },
              { value: 'architecture', label: 'Architecture' },
              { value: 'fit', label: 'Cultural / HR' },
            ]}
          />
        </div>
      </div>

      {/* Candidate Data Table */}
      <DataTable
        columns={columns}
        data={filteredCandidates}
        emptyMessage="No candidates matched your search criteria."
      />

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingCandidate ? 'Edit Candidate Profile' : 'Add Candidate to Pool'}
        subtitle="Candidate details for interview panel assignment and scheduling"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Soren Vance"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="soren@mit.edu"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Role</label>
              <input
                type="text"
                value={form.appliedRole}
                onChange={(e) => setForm({ ...form, appliedRole: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Recruitment Drive</label>
              <select
                value={form.driveId}
                onChange={(e) => setForm({ ...form, driveId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {drives.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Current Round</label>
              <select
                value={form.currentRound}
                onChange={(e) => setForm({ ...form, currentRound: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Coding Challenge">Coding Challenge</option>
                <option value="System Architecture">System Architecture</option>
                <option value="Leadership & Fit">Leadership & Fit</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pipeline Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Coding">Coding</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="In Review">In Review</option>
                <option value="Awaiting Evaluation">Awaiting Evaluation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Skills & Domain Tags (comma separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="Rust, Paxos, Linux, WebRTC"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Coordinator Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Candidate strengths or special accommodations..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-xs"
            >
              {editingCandidate ? 'Update Candidate' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={Boolean(viewingCandidate)}
        onClose={() => setViewingCandidate(null)}
        title={viewingCandidate?.name || 'Candidate Details'}
        subtitle={viewingCandidate?.appliedRole}
      >
        {viewingCandidate && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className={`w-12 h-12 rounded-xl ${viewingCandidate.avatarBg || 'bg-indigo-600'} text-white font-bold text-base flex items-center justify-center shrink-0`}>
                {viewingCandidate.initials}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{viewingCandidate.name}</h4>
                <div className="flex items-center gap-3 text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{viewingCandidate.email}</span>
                  {viewingCandidate.phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{viewingCandidate.phone}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Current Round</span>
                <div className="font-semibold text-slate-800 mt-1">{viewingCandidate.currentRound}</div>
                <div className="mt-1"><StatusBadge status={viewingCandidate.status} /></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Cumulative Score</span>
                <div className="font-bold text-indigo-600 text-lg mt-0.5">{viewingCandidate.score || '—'} / 100</div>
                <div className="text-[11px] text-slate-400">Standardized Rubric Benchmark</div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-800 block mb-1.5">Tagged Expertise</span>
              <div className="flex flex-wrap gap-1.5">
                {viewingCandidate.skills?.map(skill => (
                  <span key={skill} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs border border-indigo-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {viewingCandidate.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">Recruiter Notes</span>
                <p className="leading-relaxed">{viewingCandidate.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(candidateToDelete)}
        onClose={() => setCandidateToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Candidate"
        message={`Are you sure you want to remove ${candidateToDelete?.name} from the active talent pool? Any scheduled interview sessions for this candidate will be cancelled.`}
        confirmText="Remove Candidate"
        isDanger={true}
      />
    </div>
  );
}
