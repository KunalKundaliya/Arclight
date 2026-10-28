import React, { useState } from 'react';
import { Plus, Search, Building2, Monitor, Video, ShieldCheck, Edit2, Eye, Cpu, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export default function RoomsPage() {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState(() => storageService.getRooms());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    location: '',
    type: 'Hybrid Physical',
    capacity: 6,
    equipment: '4K Display, Dual Whiteboards, Soundbar',
    features: 'Acoustic Isolation, High-speed Fiber',
    status: 'Available',
    currentStatusNote: 'Ready for scheduled sessions'
  });

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setForm({
      name: '',
      location: 'Building 4, Floor 3',
      type: 'Hybrid Physical',
      capacity: 6,
      equipment: '4K Display, Dual Whiteboards, Soundbar',
      features: 'Acoustic Isolation, High-speed Fiber',
      status: 'Available',
      currentStatusNote: 'Ready for scheduled sessions'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      location: room.location,
      type: room.type || 'Hybrid Physical',
      capacity: room.capacity,
      equipment: (room.equipment || []).join(', '),
      features: (room.features || []).join(', '),
      status: room.status,
      currentStatusNote: room.currentStatusNote || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.location) {
      showToast('Room name and location are required', 'warning');
      return;
    }

    const roomData = {
      ...(editingRoom || {}),
      name: form.name,
      location: form.location,
      type: form.type,
      capacity: Number(form.capacity),
      equipment: form.equipment.split(',').map(eq => eq.trim()).filter(Boolean),
      features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      status: form.status,
      currentStatusNote: form.currentStatusNote
    };

    const updated = storageService.saveRoom(roomData);
    setRooms(updated);
    setIsModalOpen(false);
    showToast(
      editingRoom ? 'Room details updated' : 'Room added to resource inventory',
      'success'
    );
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.equipment || []).some(eq => eq.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Resource Inventory"
        subtitle="Manage physical interview rooms, virtual video links, hardware profiles, and capacity limits"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Rooms & Resources' }
        ]}
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resource</span>
          </button>
        }
      />

      {/* Info notice about CSP resource constraints */}
      <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
        <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Automated Room Assignment:</span> Rooms are automatically assigned to interviews based on round equipment rules (e.g. Whiteboards for Architecture rounds, WebRTC video links for live Coding).
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by room name, location, or equipment tag..."
        />
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
          />
        </div>
      </div>

      {/* Rooms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-subtle hover:shadow-card transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                    {room.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">{room.name}</h3>
                </div>
                <StatusBadge status={room.status} />
              </div>

              <div className="text-xs text-slate-500 font-medium mb-3">{room.location}</div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs mb-3">
                <span className="text-slate-500">Max Panel Capacity:</span>
                <span className="font-bold text-slate-800">{room.capacity} Persons</span>
              </div>

              {/* Equipment list */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Installed Equipment
                </span>
                <div className="flex flex-wrap gap-1">
                  {room.equipment?.map(eq => (
                    <span key={eq} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {room.currentStatusNote && (
                <div className="mt-3 text-[11px] text-slate-500 italic">
                  Note: {room.currentStatusNote}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">ID: {room.id}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingRoom(room)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="View Specs"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(room)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit Room"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room / Resource' : 'Add Room / Resource'}
        subtitle="Manage hardware configuration and scheduling limits"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Room Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Conference Room 201 (Virtual CodeCollab)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Location / Cloud Edge *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. West Wing, Floor 2"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Resource Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Hybrid Physical">Hybrid Physical</option>
                <option value="Physical Pod">Physical Pod</option>
                <option value="Virtual Hub">Virtual Hub (WebRTC / Cloud)</option>
                <option value="Physical Boardroom">Physical Boardroom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Maximum Capacity</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Installed Equipment (comma separated)</label>
            <input
              type="text"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              placeholder="Dual Displays, Whiteboard, Polycom, Screen Share"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Status Note</label>
            <input
              type="text"
              value={form.currentStatusNote}
              onChange={(e) => setForm({ ...form, currentStatusNote: e.target.value })}
              placeholder="e.g. Online and calibrated"
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
              {editingRoom ? 'Update Room' : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={Boolean(viewingRoom)}
        onClose={() => setViewingRoom(null)}
        title={viewingRoom?.name || 'Room Profile'}
        subtitle={viewingRoom?.location}
      >
        {viewingRoom && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Resource Specs</span>
              <div className="font-semibold text-slate-800 text-sm mt-1">{viewingRoom.name}</div>
              <div className="text-slate-500 mt-0.5">{viewingRoom.location} • Type: {viewingRoom.type}</div>
              <div className="mt-2"><StatusBadge status={viewingRoom.status} /></div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-800 block mb-1">Equipment Manifest</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {viewingRoom.equipment?.map(eq => (
                  <span key={eq} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-800 block mb-1">Features & Accessibility</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {viewingRoom.features?.map(feat => (
                  <span key={feat} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
