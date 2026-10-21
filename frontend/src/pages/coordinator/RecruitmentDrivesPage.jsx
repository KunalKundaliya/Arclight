import React, { useState } from 'react';
import { Plus, Search, Filter, Layers, Calendar, Users, Briefcase, Edit2, Eye, CheckCircle2, MoreVertical } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function RecruitmentDrivesPage() {
  const { showToast } = useToast();
  const [drives, setDrives] = useState(() => storageService.getDrives());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [viewingDrive, setViewingDrive] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    company: 'Nexus Quantum Labs',
    role: '',
    startDate: '2026-10-25',
    endDate: '2026-11-20',
    targetHires: 6,
    status: 'Active',
    description: '',
    rounds: 'Coding Challenge, System Architecture, Leadership & Fit'
  });

  const handleOpenCreate = () => {
    setEditingDrive(null);
    setForm({
      name: '',
      company: 'Nexus Quantum Labs',
      role: '',
      startDate: '2026-10-25',
      endDate: '2026-11-20',
      targetHires: 6,
      status: 'Active',
      description: '',
      rounds: 'Coding Challenge, System Architecture, Leadership & Fit'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (drive) => {
    setEditingDrive(drive);
    setForm({
      name: drive.name,
      company: drive.company,
      role: drive.role,
      startDate: drive.startDate,
      endDate: drive.endDate,
      targetHires: drive.targetHires,
      status: drive.status,
      description: drive.description || '',
      rounds: (drive.rounds || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleSaveDrive = (e) => {
    e.preventDefault();
    if (!form.name || !form.role) {
      showToast('Please provide drive name and target role', 'warning');
      return;
    }

    const driveData = {
      ...(editingDrive || {}),
      name: form.name,
      company: form.company,
      role: form.role,
      startDate: form.startDate,
      endDate: form.endDate,
      targetHires: Number(form.targetHires),
      status: form.status,
      description: form.description,
      rounds: form.rounds.split(',').map(r => r.trim()).filter(Boolean),
      candidatesCount: editingDrive ? editingDrive.candidatesCount : 0,
      completedInterviews: editingDrive ? editingDrive.completedInterviews : 0,
      totalScheduled: editingDrive ? editingDrive.totalScheduled : 0,
    };

    const updated = storageService.saveDrive(driveData);
    setDrives(updated);
    setIsModalOpen(false);
    showToast(
      editingDrive ? 'Recruitment Drive updated successfully!' : 'New Recruitment Drive initiated!',
      'success'
    );
  };

  // Filtered drives
  const filteredDrives = drives.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Drives"
        subtitle="Manage end-to-end recruitment pipelines, quotas, candidate volumes, and evaluation rounds"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Recruitment Drives' }
        ]}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Drive</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by drive name, organization, or target role..."
        />
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>
      </div>

      {/* Drives Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDrives.map((drive) => (
          <div
            key={drive.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-subtle hover:shadow-card transition-all p-5 flex flex-col justify-between"
          >
            <div>
              {/* Card top */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{drive.company}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate" title={drive.name}>
                    {drive.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{drive.role}</div>
                </div>
                <StatusBadge status={drive.status} />
              </div>

              {/* Description */}
              {drive.description && (
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {drive.description}
                </p>
              )}

              {/* Dates & Metrics */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Candidates</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{drive.candidatesCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{drive.totalScheduled || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hiring Target</div>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">{drive.targetHires || 10}</div>
                </div>
              </div>

              {/* Rounds badges */}
              <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Rounds:</span>
                {drive.rounds?.map((round, idx) => (
                  <span
                    key={round}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                  >
                    <span className="text-[10px] font-mono text-indigo-500 font-bold">{idx + 1}.</span>
                    {round}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{drive.startDate} → {drive.endDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingDrive(drive)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="View Drive Specs"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(drive)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit Drive"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDrives.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No recruitment drives found matching "{searchQuery}".
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDrive ? 'Edit Recruitment Drive' : 'Create Recruitment Drive'}
        subtitle="Specify drive timeline, stages, and quota parameters"
      >
        <form onSubmit={handleSaveDrive} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Drive Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Spring 2027 Core Architecture Surge"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Organization / Client *</label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Role Title *</label>
              <input
                type="text"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Hires Quota</label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.targetHires}
              onChange={(e) => setForm({ ...form, targetHires: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Interview Rounds (comma separated)</label>
            <input
              type="text"
              value={form.rounds}
              onChange={(e) => setForm({ ...form, rounds: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400 mt-1">Example: Coding Challenge, System Architecture, Leadership & Cultural Fit</p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description & Strategic Intent</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-xs"
            >
              {editingDrive ? 'Update Drive' : 'Save Drive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={Boolean(viewingDrive)}
        onClose={() => setViewingDrive(null)}
        title={viewingDrive?.name || 'Drive Details'}
        subtitle={`${viewingDrive?.company} • ${viewingDrive?.role}`}
      >
        {viewingDrive && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800 block mb-1">Campaign Overview</span>
              <p className="leading-relaxed">{viewingDrive.description || 'No extended description recorded.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Dates</span>
                <div className="font-semibold text-slate-800 mt-1">{viewingDrive.startDate} to {viewingDrive.endDate}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status & Quota</span>
                <div className="font-semibold text-slate-800 mt-1">{viewingDrive.status} ({viewingDrive.targetHires} target hires)</div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-800 block mb-2">Configured Evaluation Rounds</span>
              <div className="space-y-2">
                {viewingDrive.rounds?.map((round, idx) => (
                  <div key={round} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800">{round}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Duration: 60m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
