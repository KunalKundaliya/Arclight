import { pool } from '../config/db.js';
import { SchedulePersistenceService } from './scheduler/SchedulePersistenceService.js';
import {
  mockOverviewChartData,
  mockInterviewerUtilization,
  mockRoundFunnel,
  mockRoundDistribution,
  mockKpis
} from '../data/mockReports.js';

// Utility helper: converts snake_case database row keys to camelCase for the frontend
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  const newObj = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
}

class DbService {
  // --- DRIVES ---
  async getDrives() {
    const res = await pool.query('SELECT * FROM drives ORDER BY created_at DESC');
    return toCamel(res.rows);
  }

  async getDriveById(id) {
    const res = await pool.query('SELECT * FROM drives WHERE id = $1', [id]);
    return toCamel(res.rows[0]) || null;
  }

  async createDrive(data) {
    const id = data.id || `drv-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO drives (id, name, company, role, start_date, end_date, candidates_count, rounds, status, description, target_hires, completed_interviews, total_scheduled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        data.name,
        data.company || '',
        data.role,
        data.startDate || new Date(),
        data.endDate || new Date(),
        data.candidatesCount || 0,
        JSON.stringify(data.rounds || []),
        data.status || 'Active',
        data.description || '',
        data.targetHires || 0,
        data.completedInterviews || 0,
        data.totalScheduled || 0
      ]
    );
    return toCamel(res.rows[0]);
  }

  async updateDrive(id, data) {
    const res = await pool.query(
      `UPDATE drives 
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           status = COALESCE($3, status),
           description = COALESCE($4, description)
       WHERE id = $5
       RETURNING *`,
      [data.name, data.role, data.status, data.description, id]
    );
    return toCamel(res.rows[0]) || null;
  }

  async deleteDrive(id) {
    const res = await pool.query('DELETE FROM drives WHERE id = $1', [id]);
    return res.rowCount > 0;
  }

  // --- CANDIDATES ---
  async getCandidates() {
    const res = await pool.query('SELECT * FROM candidates ORDER BY applied_date DESC');
    return toCamel(res.rows);
  }

  async getCandidateById(id) {
    const res = await pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
    return toCamel(res.rows[0]) || null;
  }

  async createCandidate(data) {
    const id = data.id || `cand-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO candidates (id, name, email, phone, applied_role, drive_id, skills, current_round, stage, status, score, avatar_bg, initials, applied_date, room, interviewer, scheduled_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        id,
        data.name,
        data.email,
        data.phone || '',
        data.appliedRole || '',
        data.driveId || null,
        JSON.stringify(data.skills || []),
        data.currentRound || 'R1 Technical Screen',
        data.stage || 'Technical',
        data.status || 'Scheduled',
        data.score || 0,
        data.avatarBg || 'bg-indigo-600',
        data.initials || data.name.slice(0, 2).toUpperCase(),
        data.appliedDate || new Date(),
        data.room || '',
        data.interviewer || '',
        data.scheduledTime || '',
        data.notes || ''
      ]
    );
    return toCamel(res.rows[0]);
  }

  async updateCandidate(id, data) {
    const res = await pool.query(
      `UPDATE candidates 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           status = COALESCE($3, status),
           score = COALESCE($4, score),
           room = COALESCE($5, room),
           interviewer = COALESCE($6, interviewer),
           scheduled_time = COALESCE($7, scheduled_time)
       WHERE id = $8
       RETURNING *`,
      [data.name, data.email, data.status, data.score, data.room, data.interviewer, data.scheduledTime, id]
    );
    return toCamel(res.rows[0]) || null;
  }

  async deleteCandidate(id) {
    const res = await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
    return res.rowCount > 0;
  }

  // --- INTERVIEWERS ---
  async getInterviewers() {
    const res = await pool.query('SELECT * FROM interviewers ORDER BY name ASC');
    return toCamel(res.rows);
  }

  async getInterviewerById(id) {
    const res = await pool.query('SELECT * FROM interviewers WHERE id = $1', [id]);
    return toCamel(res.rows[0]) || null;
  }

  async createInterviewer(data) {
    const id = data.id || `int-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO interviewers (id, name, email, title, department, skills, max_interviews_per_day, assigned_interviews, rating, status, avatar_bg, initials, availability_summary, weekly_availability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        id,
        data.name,
        data.email,
        data.title || '',
        data.department || '',
        JSON.stringify(data.skills || []),
        data.maxInterviewsPerDay || 3,
        data.assignedInterviews || 0,
        data.rating || 5.0,
        data.status || 'Available',
        data.avatarBg || 'bg-indigo-600',
        data.initials || data.name.slice(0, 2).toUpperCase(),
        data.availabilitySummary || '',
        JSON.stringify(data.weeklyAvailability || {})
      ]
    );
    return toCamel(res.rows[0]);
  }

  async updateInterviewer(id, data) {
    const weeklyAvail = data.weeklyAvailability ? JSON.stringify(data.weeklyAvailability) : null;
    const skills = data.skills ? JSON.stringify(data.skills) : null;

    const res = await pool.query(
      `UPDATE interviewers 
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           assigned_interviews = COALESCE($3, assigned_interviews),
           max_interviews_per_day = COALESCE($4, max_interviews_per_day),
           availability_summary = COALESCE($5, availability_summary),
           weekly_availability = COALESCE($6, weekly_availability),
           skills = COALESCE($7, skills),
           title = COALESCE($8, title),
           department = COALESCE($9, department)
       WHERE id = $10
       RETURNING *`,
      [
        data.name || null,
        data.status || null,
        data.assignedInterviews !== undefined ? data.assignedInterviews : null,
        data.maxInterviewsPerDay !== undefined ? data.maxInterviewsPerDay : null,
        data.availabilitySummary || null,
        weeklyAvail,
        skills,
        data.title || null,
        data.department || null,
        id
      ]
    );
    return toCamel(res.rows[0]) || null;
  }

  async deleteInterviewer(id) {
    const res = await pool.query('DELETE FROM interviewers WHERE id = $1', [id]);
    return res.rowCount > 0;
  }

  // --- ROOMS ---
  async getRooms() {
    const res = await pool.query('SELECT * FROM rooms ORDER BY name ASC');
    return toCamel(res.rows);
  }

  async getRoomById(id) {
    const res = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return toCamel(res.rows[0]) || null;
  }

  async createRoom(data) {
    const id = data.id || `rm-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO rooms (id, name, location, capacity, type, equipment, status, features, current_status_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        data.name,
        data.location || '',
        data.capacity || 4,
        data.type || 'Physical Pod',
        JSON.stringify(data.equipment || []),
        data.status || 'Available',
        JSON.stringify(data.features || []),
        data.currentStatusNote || ''
      ]
    );
    return toCamel(res.rows[0]);
  }

  async updateRoom(id, data) {
    const res = await pool.query(
      `UPDATE rooms 
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           current_status_note = COALESCE($3, current_status_note)
       WHERE id = $4
       RETURNING *`,
      [data.name, data.status, data.currentStatusNote, id]
    );
    return toCamel(res.rows[0]) || null;
  }

  async deleteRoom(id) {
    const res = await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
    return res.rowCount > 0;
  }

  // --- INTERVIEWS ---
  async getInterviews() {
    const res = await pool.query('SELECT * FROM interviews ORDER BY date ASC, start_time ASC');
    return toCamel(res.rows);
  }

  async getInterviewById(id) {
    const res = await pool.query('SELECT * FROM interviews WHERE id = $1', [id]);
    return toCamel(res.rows[0]) || null;
  }

  async createInterview(data) {
    const id = data.id || `intv-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO interviews (id, candidate_id, candidate_name, candidate_email, candidate_role, drive_id, interviewer_ids, interviewer_names, room_id, room_name, round_type, round_title, date, day_name, start_time, end_time, duration, status, evaluation_status, meeting_url, score, badge_text, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`,
      [
        id,
        data.candidateId || null,
        data.candidateName,
        data.candidateEmail || '',
        data.candidateRole || '',
        data.driveId || null,
        JSON.stringify(data.interviewerIds || []),
        JSON.stringify(data.interviewerNames || []),
        data.roomId || null,
        data.roomName || '',
        data.roundType || 'Technical',
        data.roundTitle || 'Technical Screen',
        data.date,
        data.dayName || '',
        data.startTime,
        data.endTime || '',
        data.duration || '45 min',
        data.status || 'Scheduled',
        data.evaluationStatus || 'Pending',
        data.meetingUrl || '',
        data.score || null,
        data.badgeText || '',
        data.notes || ''
      ]
    );
    return toCamel(res.rows[0]);
  }

  async updateInterview(id, data) {
    const res = await pool.query(
      `UPDATE interviews 
       SET status = COALESCE($1, status),
           date = COALESCE($2, date),
           start_time = COALESCE($3, start_time),
           notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
      [data.status, data.date, data.startTime, data.notes, id]
    );
    return toCamel(res.rows[0]) || null;
  }

  async deleteInterview(id) {
    const res = await pool.query('DELETE FROM interviews WHERE id = $1', [id]);
    return res.rowCount > 0;
  }

  // --- STAGE 7 SCHEDULE TRANSACTIONS ---
  async applyScheduleTransaction(driveId, assignments, options = {}) {
    return SchedulePersistenceService.applyScheduleTransaction({ driveId, assignments, options });
  }

  async rollbackSchedule(driveId, options = {}) {
    return SchedulePersistenceService.rollbackSchedule({ driveId, ...options });
  }

  async getScheduleStatus(driveId) {
    return SchedulePersistenceService.getScheduleStatus({ driveId });
  }

  // --- EVALUATIONS ---
  async getEvaluations() {
    const res = await pool.query('SELECT * FROM evaluations ORDER BY submitted_date DESC');
    return toCamel(res.rows);
  }

  async getEvaluationById(id) {
    const res = await pool.query('SELECT * FROM evaluations WHERE id = $1', [id]);
    return toCamel(res.rows[0]) || null;
  }

  async saveEvaluation(data) {
    const id = data.id || `eval-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO evaluations (id, interview_id, candidate_id, candidate_name, role, round, interviewer_name, interviewer_id, status, total_score, recommendation, rubric, strengths, growth_areas, summary, submitted_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE 
       SET total_score = EXCLUDED.total_score,
           recommendation = EXCLUDED.recommendation,
           rubric = EXCLUDED.rubric,
           strengths = EXCLUDED.strengths,
           growth_areas = EXCLUDED.growth_areas,
           summary = EXCLUDED.summary
       RETURNING *`,
      [
        id,
        data.interviewId || null,
        data.candidateId || null,
        data.candidateName || '',
        data.role || '',
        data.round || '',
        data.interviewerName || '',
        data.interviewerId || null,
        data.status || 'Completed',
        data.totalScore || 0,
        data.recommendation || '',
        JSON.stringify(data.rubric || {}),
        data.strengths || '',
        data.growthAreas || '',
        data.summary || '',
        data.submittedDate || new Date()
      ]
    );
    return toCamel(res.rows[0]);
  }

  // --- NOTIFICATIONS ---
  async getNotifications() {
    const res = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    return toCamel(res.rows);
  }

  async markNotificationRead(id) {
    const res = await pool.query('UPDATE notifications SET read = true WHERE id = $1 RETURNING *', [id]);
    return toCamel(res.rows[0]);
  }

  async markAllNotificationsRead() {
    const res = await pool.query('UPDATE notifications SET read = true RETURNING *');
    return toCamel(res.rows);
  }

  // --- REPORTS ---
  async getReports() {
    // Dynamic calculation from real database records
    const [drivesCount, candCount, intvCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM drives WHERE status = $1', ['Active']),
      pool.query('SELECT COUNT(*) FROM candidates'),
      pool.query('SELECT COUNT(*) FROM interviews')
    ]);

    return {
      overviewChart: mockOverviewChartData,
      interviewerUtilization: mockInterviewerUtilization,
      roundFunnel: mockRoundFunnel,
      roundDistribution: mockRoundDistribution,
      kpis: {
        ...mockKpis,
        activeDrives: parseInt(drivesCount.rows[0].count, 10),
        candidatesInNorthstar: parseInt(candCount.rows[0].count, 10),
        interviewsThisWeek: parseInt(intvCount.rows[0].count, 10),
      }
    };
  }
}

export const dbService = new DbService();
