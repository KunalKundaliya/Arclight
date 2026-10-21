import { initialDrives } from '../data/mockDrives.js';
import { initialCandidates } from '../data/mockCandidates.js';
import { initialInterviewers } from '../data/mockInterviewers.js';
import { initialRooms } from '../data/mockRooms.js';
import { initialInterviews } from '../data/mockInterviews.js';
import { initialEvaluations } from '../data/mockEvaluations.js';
import { initialNotifications } from '../data/mockNotifications.js';
import {
  mockOverviewChartData,
  mockInterviewerUtilization,
  mockRoundFunnel,
  mockRoundDistribution,
  mockKpis
} from '../data/mockReports.js';

class DbService {
  constructor() {
    this.resetDatabase();
  }

  resetDatabase() {
    this.drives = JSON.parse(JSON.stringify(initialDrives));
    this.candidates = JSON.parse(JSON.stringify(initialCandidates));
    this.interviewers = JSON.parse(JSON.stringify(initialInterviewers));
    this.rooms = JSON.parse(JSON.stringify(initialRooms));
    this.interviews = JSON.parse(JSON.stringify(initialInterviews));
    this.evaluations = JSON.parse(JSON.stringify(initialEvaluations));
    this.notifications = JSON.parse(JSON.stringify(initialNotifications));
    this.reports = {
      overviewChart: JSON.parse(JSON.stringify(mockOverviewChartData)),
      interviewerUtilization: JSON.parse(JSON.stringify(mockInterviewerUtilization)),
      roundFunnel: JSON.parse(JSON.stringify(mockRoundFunnel)),
      roundDistribution: JSON.parse(JSON.stringify(mockRoundDistribution)),
      kpis: JSON.parse(JSON.stringify(mockKpis))
    };
  }

  // --- DRIVES ---
  getDrives() {
    return this.drives;
  }

  getDriveById(id) {
    return this.drives.find(d => d.id === id);
  }

  createDrive(data) {
    const newDrive = {
      ...data,
      id: data.id || `drv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.drives.unshift(newDrive);
    return newDrive;
  }

  updateDrive(id, data) {
    const idx = this.drives.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.drives[idx] = { ...this.drives[idx], ...data };
    return this.drives[idx];
  }

  deleteDrive(id) {
    const idx = this.drives.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.drives.splice(idx, 1);
    return true;
  }

  // --- CANDIDATES ---
  getCandidates() {
    return this.candidates;
  }

  getCandidateById(id) {
    return this.candidates.find(c => c.id === id);
  }

  createCandidate(data) {
    const newCandidate = {
      ...data,
      id: data.id || `cand-${Date.now()}`,
      appliedDate: data.appliedDate || new Date().toISOString().split('T')[0]
    };
    this.candidates.unshift(newCandidate);
    return newCandidate;
  }

  updateCandidate(id, data) {
    const idx = this.candidates.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.candidates[idx] = { ...this.candidates[idx], ...data };
    return this.candidates[idx];
  }

  deleteCandidate(id) {
    const idx = this.candidates.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.candidates.splice(idx, 1);
    return true;
  }

  // --- INTERVIEWERS ---
  getInterviewers() {
    return this.interviewers;
  }

  getInterviewerById(id) {
    return this.interviewers.find(i => i.id === id);
  }

  createInterviewer(data) {
    const newInterviewer = {
      ...data,
      id: data.id || `int-${Date.now()}`,
      rating: data.rating || 5.0,
      assignedInterviews: data.assignedInterviews || 0
    };
    this.interviewers.unshift(newInterviewer);
    return newInterviewer;
  }

  updateInterviewer(id, data) {
    const idx = this.interviewers.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.interviewers[idx] = { ...this.interviewers[idx], ...data };
    return this.interviewers[idx];
  }

  deleteInterviewer(id) {
    const idx = this.interviewers.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.interviewers.splice(idx, 1);
    return true;
  }

  // --- ROOMS ---
  getRooms() {
    return this.rooms;
  }

  getRoomById(id) {
    return this.rooms.find(r => r.id === id);
  }

  createRoom(data) {
    const newRoom = {
      ...data,
      id: data.id || `rm-${Date.now()}`
    };
    this.rooms.unshift(newRoom);
    return newRoom;
  }

  updateRoom(id, data) {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.rooms[idx] = { ...this.rooms[idx], ...data };
    return this.rooms[idx];
  }

  deleteRoom(id) {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.rooms.splice(idx, 1);
    return true;
  }

  // --- INTERVIEWS ---
  getInterviews() {
    return this.interviews;
  }

  getInterviewById(id) {
    return this.interviews.find(i => i.id === id);
  }

  createInterview(data) {
    const newInterview = {
      ...data,
      id: data.id || `intv-${Date.now()}`
    };
    this.interviews.unshift(newInterview);
    return newInterview;
  }

  updateInterview(id, data) {
    const idx = this.interviews.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.interviews[idx] = { ...this.interviews[idx], ...data };
    return this.interviews[idx];
  }

  deleteInterview(id) {
    const idx = this.interviews.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.interviews.splice(idx, 1);
    return true;
  }

  // --- EVALUATIONS ---
  getEvaluations() {
    return this.evaluations;
  }

  getEvaluationById(id) {
    return this.evaluations.find(e => e.id === id);
  }

  saveEvaluation(data) {
    const idx = this.evaluations.findIndex(e => e.id === data.id);
    if (idx >= 0) {
      this.evaluations[idx] = { ...this.evaluations[idx], ...data };
      return this.evaluations[idx];
    } else {
      const newEval = {
        ...data,
        id: data.id || `eval-${Date.now()}`,
        submittedAt: new Date().toISOString()
      };
      this.evaluations.unshift(newEval);
      return newEval;
    }
  }

  // --- NOTIFICATIONS ---
  getNotifications() {
    return this.notifications;
  }

  markNotificationRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return notif;
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => { n.read = true; });
    return this.notifications;
  }

  // --- REPORTS ---
  getReports() {
    return this.reports;
  }
}

export const dbService = new DbService();
