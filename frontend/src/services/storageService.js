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
  orgName: 'Nexus Quantum Laboratories',
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
  // Drives
  getDrives() {
    return load(STORAGE_KEYS.DRIVES, initialDrives);
  },
  saveDrive(drive) {
    const drives = this.getDrives();
    const index = drives.findIndex(d => d.id === drive.id);
    if (index >= 0) {
      drives[index] = { ...drives[index], ...drive };
    } else {
      drives.unshift({ ...drive, id: drive.id || `drv-${Date.now()}` });
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
    } else {
      candidates.unshift({
        ...candidate,
        id: candidate.id || `cand-${Date.now()}`,
        avatarBg: candidate.avatarBg || 'bg-indigo-600',
        initials: candidate.initials || candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      });
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
    } else {
      interviewers.unshift({
        ...interviewer,
        id: interviewer.id || `int-${Date.now()}`,
        avatarBg: interviewer.avatarBg || 'bg-indigo-600',
        initials: interviewer.initials || interviewer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      });
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
      rooms.unshift({ ...room, id: room.id || `room-${Date.now()}` });
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
    } else {
      interviews.unshift({ ...interview, id: interview.id || `intv-${Date.now()}` });
    }
    save(STORAGE_KEYS.INTERVIEWS, interviews);
    return interviews;
  },
  deleteInterview(interviewId) {
    const interviews = this.getInterviews().filter(i => i.id !== interviewId);
    save(STORAGE_KEYS.INTERVIEWS, interviews);
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
    return notifs;
  },
  markAllAsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, isRead: true }));
    save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return notifs;
  },

  // Evaluations
  getEvaluations() {
    return load(STORAGE_KEYS.EVALUATIONS, initialEvaluations);
  },
  submitEvaluation(evaluation) {
    const evals = this.getEvaluations();
    const index = evals.findIndex(e => e.id === evaluation.id);
    if (index >= 0) {
      evals[index] = { ...evals[index], ...evaluation, submittedDate: new Date().toISOString().split('T')[0] };
    } else {
      evals.unshift({
        ...evaluation,
        id: evaluation.id || `eval-${Date.now()}`,
        submittedDate: new Date().toISOString().split('T')[0]
      });
    }
    save(STORAGE_KEYS.EVALUATIONS, evals);

    // Also update interview status if matching
    if (evaluation.interviewId) {
      const interviews = this.getInterviews();
      const intIdx = interviews.findIndex(i => i.id === evaluation.interviewId);
      if (intIdx >= 0) {
        interviews[intIdx].evaluationStatus = 'Completed';
        interviews[intIdx].score = evaluation.totalScore;
        save(STORAGE_KEYS.INTERVIEWS, interviews);
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
    localStorage.removeItem(STORAGE_KEYS.DRIVES);
    localStorage.removeItem(STORAGE_KEYS.CANDIDATES);
    localStorage.removeItem(STORAGE_KEYS.INTERVIEWERS);
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.INTERVIEWS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};
