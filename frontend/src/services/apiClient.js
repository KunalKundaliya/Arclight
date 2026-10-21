/**
 * ArcLight - Frontend API Client
 * Connects to the Express backend (/api) via Vite proxy.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
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

  // Evaluations
  getEvaluations() {
    return request('/evaluations');
  },
  saveEvaluation(data) {
    return request('/evaluations', { method: 'POST', body: JSON.stringify(data) });
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
