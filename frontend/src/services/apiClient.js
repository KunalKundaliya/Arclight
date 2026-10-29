/**
 * ArcLight - Frontend API Client
 * Connects to the Express backend (/api) via Vite proxy.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Inject Bearer Token from localStorage if logged in
  const token = localStorage.getItem('arclight_token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Client] Error on ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const apiClient = {
  // Health
  checkHealth() {
    return request('/health');
  },
  // Auth API
  login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register(userData) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  getMe() {
    return request('/auth/me');
  },


  // Drives
  getDrives() {
    return request('/drives');
  },
  createDrive(data) {
    return request('/drives', { method: 'POST', body: JSON.stringify(data) });
  },
  updateDrive(id, data) {
    return request(`/drives/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteDrive(id) {
    return request(`/drives/${id}`, { method: 'DELETE' });
  },

  // Candidates
  getCandidates(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/candidates${qs ? `?${qs}` : ''}`);
  },
  createCandidate(data) {
    return request('/candidates', { method: 'POST', body: JSON.stringify(data) });
  },
  updateCandidate(id, data) {
    return request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteCandidate(id) {
    return request(`/candidates/${id}`, { method: 'DELETE' });
  },

  // Interviewers
  getInterviewers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/interviewers${qs ? `?${qs}` : ''}`);
  },
  createInterviewer(data) {
    return request('/interviewers', { method: 'POST', body: JSON.stringify(data) });
  },
  updateInterviewer(id, data) {
    return request(`/interviewers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  // Rooms
  getRooms() {
    return request('/rooms');
  },
  createRoom(data) {
    return request('/rooms', { method: 'POST', body: JSON.stringify(data) });
  },

  // Interviews
  getInterviews(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/interviews${qs ? `?${qs}` : ''}`);
  },
  createInterview(data) {
    return request('/interviews', { method: 'POST', body: JSON.stringify(data) });
  },
  updateInterview(id, data) {
    return request(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  // CSP Solver (Backend execution)
  solveScheduler(solverParams) {
    return request('/scheduler/solve', {
      method: 'POST',
      body: JSON.stringify(solverParams),
    });
  },

  // Stage 7: Persistence & Safe Transactions
  applyScheduler(data) {
    return request('/scheduler/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  rollbackScheduler(data) {
    return request('/scheduler/rollback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSchedulerStatus(driveId) {
    return request(`/scheduler/status/${driveId}`);
  },

  // Stage 8: Dynamic Rescheduling
  rescheduleFacultyCallout(data) {
    return request('/scheduler/reschedule/faculty-callout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  rescheduleRoomOutage(data) {
    return request('/scheduler/reschedule/room-outage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  rescheduleCandidate(data) {
    return request('/scheduler/reschedule/candidate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Evaluations
  getEvaluations() {
    return request('/evaluations');
  },
  saveEvaluation(data) {
    return request('/evaluations', { method: 'POST', body: JSON.stringify(data) });
  },

  // Notifications
  getNotifications() {
    return request('/notifications');
  },
  createNotification(data) {
    return request('/notifications', { method: 'POST', body: JSON.stringify(data) });
  },
  markNotificationRead(id) {
    return request(`/notifications/${id}/read`, { method: 'PUT' });
  },
  markAllNotificationsRead() {
    return request('/notifications/read-all', { method: 'PUT' });
  },

  // Reports
  getReports() {
    return request('/reports');
  },

  // Reset
  resetDatabase() {
    return request('/reports/reset', { method: 'POST' });
  },
};
