import React, { useState } from 'react';
import { Plus, Search, Filter, UserCheck, Mail, Calendar, Award, Star, Clock, Edit2, Eye, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function InterviewersPage() {
  const { showToast } = useToast();
  const [interviewers, setInterviewers] = useState(() => storageService.getInterviewers());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState(null);
  const [viewingInterviewer, setViewingInterviewer] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: 'Staff Engineer',
    department: 'Engineering',
    skills: 'Distributed Systems, Architecture, Go',
    maxInterviewsPerDay: 3,
    availabilitySummary: 'Mon, Wed, Fri (10:00 AM - 4:00 PM)',
    status: 'Available'
  });

  const handleOpenAdd = () => {
    setEditingInterviewer(null);
    setForm({
      name: '',
      email: '',
      title: 'Staff Engineer',
      department: 'Engineering',
      skills: 'Distributed Systems, Architecture, Go',
      maxInterviewsPerDay: 3,
      availabilitySummary: 'Mon, Wed, Fri (10:00 AM - 4:00 PM)',
      status: 'Available'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (int) => {
    setEditingInterviewer(int);
    setForm({
      name: int.name,
      email: int.email,
      title: int.title,
      department: int.department || 'Engineering',
      skills: (int.skills || []).join(', '),
      maxInterviewsPerDay: int.maxInterviewsPerDay || 3,
      availabilitySummary: int.availabilitySummary || '',
      status: int.status
    });
    setIsAddModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Interviewer name and email are required', 'warning');
      return;
    }

    const intData = {
      ...(editingInterviewer || {}),
      name: form.name,
      email: form.email,
      title: form.title,
      department: form.department,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      maxInterviewsPerDay: Number(form.maxInterviewsPerDay),
      availabilitySummary: form.availabilitySummary,
      status: form.status,
      assignedInterviews: editingInterviewer ? editingInterviewer.assignedInterviews : 0,
      rating: editingInterviewer ? editingInterviewer.rating : 4.9,
      weeklyAvailability: editingInterviewer ? editingInterviewer.weeklyAvailability : {
        Monday: ['10:00', '11:00', '14:00'],
        Wednesday: ['10:00', '11:00', '14:00'],
        Friday: ['10:00', '11:00']
      }
    };

    const updated = storageService.saveInterviewer(intData);
    setInterviewers(updated);
    setIsAddModalOpen(false);
    showToast(
      editingInterviewer ? 'Interviewer profile updated' : 'Interviewer added to evaluation panel',
      'success'
    );
  };

  // Filtered interviewers
  const filteredInterviewers = interviewers.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || i.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Interviewer',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${row.avatarBg || 'bg-violet-600'} text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
            {row.initials || row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
              onClick={() => setViewingInterviewer(row)}
            >
              {row.name}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Title & Department',
      key: 'title',
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">{row.title}</div>
          <div className="text-[11px] text-slate-400">{row.department}</div>
        </div>
      )
    },
    {
      header: 'Domain Expertise',
      key: 'skills',
      render: (skills) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {(skills || []).slice(0, 3).map(skill => (
            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
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
      header: 'Weekly Availability',
      key: 'availabilitySummary',
      render: (text) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[170px]" title={text}>{text || 'Mon-Fri flexible'}</span>
        </div>
      )
    },
    {
      header: 'Workload & Score',
      key: 'assignedInterviews',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-800">{row.assignedInterviews} assigned</div>
            <div className="text-[10px] text-slate-400">Max {row.maxInterviewsPerDay}/day</div>
          </div>
          {row.rating && (
            <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{row.rating}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingInterviewer(row)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Interviewer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviewer Panel & Faculty"
        subtitle="Manage technical evaluators, domain specializations, weekly availability windows, and daily interview limits"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Interviewers' }
        ]}
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Interviewer</span>
          </button>
        }
      />

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by interviewer name, title, skill or domain..."
        />
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'busy', label: 'Busy' },
              { value: 'on leave', label: 'On Leave' },
            ]}
          />
        </div>
      </div>

      {/* Interviewers Data Table */}
      <DataTable
        columns={columns}
        data={filteredInterviewers}
        emptyMessage="No interviewers found matching your search."
      />

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingInterviewer ? 'Edit Interviewer Profile' : 'Add Interviewer to Panel'}
        subtitle="Configure skills and scheduling availability rules for the CSP solver"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Dr. Evelyn Voss"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="evaluator@company.io"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Professional Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Principal Architect"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Daily Cap (Limit)</label>
              <input
                type="number"
                min="1"
                max="8"
                value={form.maxInterviewsPerDay}
                onChange={(e) => setForm({ ...form, maxInterviewsPerDay: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Availability Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Skills & Domain Rubrics (comma separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="Distributed Systems, Raft, Go, Linux"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Weekly Availability Summary</label>
            <input
              type="text"
              value={form.availabilitySummary}
              onChange={(e) => setForm({ ...form, availabilitySummary: e.target.value })}
              placeholder="e.g. Mon, Wed, Fri (10:00 AM - 4:00 PM)"
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
              {editingInterviewer ? 'Update Interviewer' : 'Save Interviewer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={Boolean(viewingInterviewer)}
        onClose={() => setViewingInterviewer(null)}
        title={viewingInterviewer?.name || 'Interviewer Profile'}
        subtitle={viewingInterviewer?.title}
      >
        {viewingInterviewer && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className={`w-12 h-12 rounded-xl ${viewingInterviewer.avatarBg || 'bg-violet-600'} text-white font-bold text-base flex items-center justify-center shrink-0`}>
                {viewingInterviewer.initials}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{viewingInterviewer.name}</h4>
                <div className="text-xs text-slate-500">{viewingInterviewer.email} • {viewingInterviewer.department}</div>
                <div className="mt-1"><StatusBadge status={viewingInterviewer.status} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Capacity & Limits</span>
                <div className="font-semibold text-slate-800 mt-1">
                  Max {viewingInterviewer.maxInterviewsPerDay} sessions / day
                </div>
                <div className="text-[11px] text-slate-500">{viewingInterviewer.assignedInterviews} assigned this cycle</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Interviewer Quality Rating</span>
                <div className="font-bold text-amber-600 text-lg mt-0.5 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{viewingInterviewer.rating} / 5.0</span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-800 block mb-1.5">Domain Competencies</span>
              <div className="flex flex-wrap gap-1.5">
                {viewingInterviewer.skills?.map(skill => (
                  <span key={skill} className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-medium text-xs border border-violet-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-800 block mb-1">Weekly Availability Window</span>
              <p className="leading-relaxed font-mono text-[11px] text-indigo-700">
                {viewingInterviewer.availabilitySummary || 'Flexible schedule on file'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
