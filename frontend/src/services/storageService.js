import { apiClient } from './apiClient';
import { initialDrives } from '../data/mockDrives';
import { initialCandidates } from '../data/mockCandidates';
import { initialInterviewers } from '../data/mockInterviewers';
import { initialRooms } from '../data/mockRooms';
import { initialInterviews } from '../data/mockInterviews';
import { initialNotifications } from '../data/mockNotifications';
import { initialEvaluations } from '../data/mockEvaluations';

const STORAGE_KEYS = {
  DRIVES: 'aot_drives',
  CANDIDATES: 'aot_candidates',
  INTERVIEWERS: 'aot_interviewers',
  ROOMS: 'aot_rooms',
  INTERVIEWS: 'aot_interviews',
  NOTIFICATIONS: 'aot_notifications',
  EVALUATIONS: 'aot_evaluations',
  SETTINGS: 'aot_settings',
};

const defaultSettings = {
  orgName: 'Webster University Career & Placement Cell',
  orgDomain: 'arclight.io',
  defaultDuration: 60,
  bufferMinutes: 15,
  timeZone: 'America/New_York (UTC-4)',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  autoResolveMinorConflicts: true,
  emailNotifications: true,
  smsReminders: false,
  slackIntegration: true,
  aiAssistantRecommendations: true,
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error loading key ${key} from localStorage:`, err);
    return fallback;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key} to localStorage:`, err);
  }
}

export const storageService = {
  // Sync all tables from PostgreSQL into local cache on app load
  async syncFromBackend() {
    try {
      const [drives, candidates, interviewers, rooms, interviews, evaluations, notifications] = await Promise.all([
        apiClient.getDrives().catch(() => null),
        apiClient.getCandidates().catch(() => null),
        apiClient.getInterviewers().catch(() => null),
        apiClient.getRooms().catch(() => null),
        apiClient.getInterviews().catch(() => null),
        apiClient.getEvaluations().catch(() => null),
        apiClient.getNotifications().catch(() => null)
      ]);

      if (drives?.data) save(STORAGE_KEYS.DRIVES, drives.data);
      if (candidates?.data) save(STORAGE_KEYS.CANDIDATES, candidates.data);
      if (interviewers?.data) save(STORAGE_KEYS.INTERVIEWERS, interviewers.data);
      if (rooms?.data) save(STORAGE_KEYS.ROOMS, rooms.data);
      if (interviews?.data) save(STORAGE_KEYS.INTERVIEWS, interviews.data);
      if (evaluations?.data) save(STORAGE_KEYS.EVALUATIONS, evaluations.data);
      if (notifications?.data) save(STORAGE_KEYS.NOTIFICATIONS, notifications.data);

      console.log('✅ Synchronized state with PostgreSQL database');
    } catch (err) {
      console.warn('⚠️ Could not sync with PostgreSQL, using offline cache:', err.message);
    }
  },

  // Drives
  getDrives() {
    return load(STORAGE_KEYS.DRIVES, initialDrives);
  },
  saveDrive(drive) {
    const drives = this.getDrives();
    const index = drives.findIndex(d => d.id === drive.id);
    if (index >= 0) {
      drives[index] = { ...drives[index], ...drive };
      apiClient.updateDrive(drive.id, drive).catch(console.error);
    } else {
      const newDrive = { ...drive, id: drive.id || `drv-${Date.now()}` };
      drives.unshift(newDrive);
      apiClient.createDrive(newDrive).catch(console.error);
    }
    save(STORAGE_KEYS.DRIVES, drives);
    return drives;
  },

  // Candidates
  getCandidates() {
    return load(STORAGE_KEYS.CANDIDATES, initialCandidates);
  },
  saveCandidate(candidate) {
    const candidates = this.getCandidates();
    const index = candidates.findIndex(c => c.id === candidate.id);
    if (index >= 0) {
      candidates[index] = { ...candidates[index], ...candidate };
      apiClient.updateCandidate(candidate.id, candidate).catch(console.error);
    } else {
      const newCand = {
        ...candidate,
        id: candidate.id || `cand-${Date.now()}`,
        avatarBg: candidate.avatarBg || 'bg-indigo-600',
        initials: candidate.initials || candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };
      candidates.unshift(newCand);
      apiClient.createCandidate(newCand).catch(console.error);
    }
    save(STORAGE_KEYS.CANDIDATES, candidates);
    return candidates;
  },

  // Interviewers
  getInterviewers() {
    return load(STORAGE_KEYS.INTERVIEWERS, initialInterviewers);
  },
  saveInterviewer(interviewer) {
    const interviewers = this.getInterviewers();
    const index = interviewers.findIndex(i => i.id === interviewer.id);
    if (index >= 0) {
      interviewers[index] = { ...interviewers[index], ...interviewer };
      apiClient.updateInterviewer(interviewer.id, interviewer).catch(console.error);
    } else {
      const newInt = {
        ...interviewer,
        id: interviewer.id || `int-${Date.now()}`,
        avatarBg: interviewer.avatarBg || 'bg-indigo-600',
        initials: interviewer.initials || interviewer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };
      interviewers.unshift(newInt);
      apiClient.createInterviewer(newInt).catch(console.error);
    }
    save(STORAGE_KEYS.INTERVIEWERS, interviewers);
    return interviewers;
  },

  // Rooms
  getRooms() {
    return load(STORAGE_KEYS.ROOMS, initialRooms);
  },
  saveRoom(room) {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      rooms[index] = { ...rooms[index], ...room };
    } else {
      const newRoom = { ...room, id: room.id || `room-${Date.now()}` };
      rooms.unshift(newRoom);
      apiClient.createRoom(newRoom).catch(console.error);
    }
    save(STORAGE_KEYS.ROOMS, rooms);
    return rooms;
  },

  // Interviews
  getInterviews() {
    return load(STORAGE_KEYS.INTERVIEWS, initialInterviews);
  },
  saveInterview(interview) {
    const interviews = this.getInterviews();
    const index = interviews.findIndex(i => i.id === interview.id);
    if (index >= 0) {
      interviews[index] = { ...interviews[index], ...interview };
      apiClient.updateInterview(interview.id, interview).catch(console.error);
    } else {
      const newIntv = { ...interview, id: interview.id || `intv-${Date.now()}` };
      interviews.unshift(newIntv);
      apiClient.createInterview(newIntv).catch(console.error);
    }
    save(STORAGE_KEYS.INTERVIEWS, interviews);
    return interviews;
  },
  deleteInterview(interviewId) {
    const interviews = this.getInterviews().filter(i => i.id !== interviewId);
    save(STORAGE_KEYS.INTERVIEWS, interviews);
    fetch(`/api/interviews/${interviewId}`, { method: 'DELETE' }).catch(console.error);
    return interviews;
  },

  // Notifications
  getNotifications() {
    return load(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  },
  markAsRead(notificationId) {
    const notifs = this.getNotifications().map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    apiClient.markNotificationRead(notificationId).catch(console.error);
    return notifs;
  },
  markAllAsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, isRead: true }));
    save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    apiClient.markAllNotificationsRead().catch(console.error);
    return notifs;
  },

  // Evaluations
  getEvaluations() {
    return load(STORAGE_KEYS.EVALUATIONS, initialEvaluations);
  },
  submitEvaluation(evaluation) {
    const evals = this.getEvaluations();
    const index = evals.findIndex(e => e.id === evaluation.id);
    let savedEval;
    if (index >= 0) {
      savedEval = { ...evals[index], ...evaluation, submittedDate: new Date().toISOString().split('T')[0] };
      evals[index] = savedEval;
    } else {
      savedEval = {
        ...evaluation,
        id: evaluation.id || `eval-${Date.now()}`,
        submittedDate: new Date().toISOString().split('T')[0]
      };
      evals.unshift(savedEval);
    }
    save(STORAGE_KEYS.EVALUATIONS, evals);
    apiClient.saveEvaluation(savedEval).catch(console.error);

    // Also update interview status if matching
    if (evaluation.interviewId) {
      const interviews = this.getInterviews();
      const intIdx = interviews.findIndex(i => i.id === evaluation.interviewId);
      if (intIdx >= 0) {
        interviews[intIdx].evaluationStatus = 'Completed';
        interviews[intIdx].score = evaluation.totalScore;
        save(STORAGE_KEYS.INTERVIEWS, interviews);
        apiClient.updateInterview(evaluation.interviewId, interviews[intIdx]).catch(console.error);
      }
    }
    return evals;
  },

  // Settings
  getSettings() {
    return load(STORAGE_KEYS.SETTINGS, defaultSettings);
  },
  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    save(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // Reset to default mock data
  resetAll() {
    localStorage.clear();
    apiClient.resetDatabase().catch(console.error);
  }
};

// Automatically sync on initial load
storageService.syncFromBackend();
