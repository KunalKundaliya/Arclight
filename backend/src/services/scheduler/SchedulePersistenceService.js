/**
 * ArcLight - Stage 7: Schedule Persistence Service
 * 
 * Provides transactional, safe persistence for scheduling outcomes with:
 * 1. Pre-commit concurrency collision checks against existing locked database bookings.
 * 2. Atomic all-or-nothing batch transactions (BEGIN ... COMMIT ... ROLLBACK).
 * 3. Synchronization of candidate statuses ('Scheduled', stage, room, scheduled_time).
 * 4. Synchronization of faculty workload counters (assigned_interviews).
 * 5. Drive progress metrics tracking (total_scheduled, status).
 * 6. Audit notification generation for coordination workflows.
 * 7. Safe schedule rollback and cancellation capabilities.
 * 8. Built-in InMemoryTransactionalPool for isolated, deterministic unit testing.
 */

import { pool } from '../../config/db.js';
import { parseTimeString } from './TimezoneUtils.js';
import { doIntervalsOverlap, hasBufferViolation } from './IntervalUtils.js';
import { validateScheduleBatch } from './ConstraintValidator.js';

/**
 * Normalizes date to 'YYYY-MM-DD' format string.
 * @param {string|Date} val 
 * @returns {string}
 */
export function normalizeDate(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return val.split('T')[0];
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).split('T')[0];
}

/**
 * Normalizes an array or JSON string of IDs.
 * @param {string|string[]|any} val 
 * @returns {string[]}
 */
export function normalizeIdArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [val];
    }
  }
  return [];
}

/**
 * Converts snake_case database row keys to camelCase.
 * @param {Object} row 
 * @returns {Object}
 */
export function rowToCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    out[camel] = v;
  }
  return out;
}

export class SchedulePersistenceService {
  /**
   * Checks proposed assignments against existing active interviews in the database
   * to detect any concurrency collisions (candidate double-booking, panel collision, chamber collision).
   * 
   * @param {Object} params
   * @param {Object[]} params.assignments - Proposed schedule assignments
   * @param {string} [params.driveId] - Current drive ID (to ignore self-replaces if requested)
   * @param {boolean} [params.ignoreCurrentDrive=false] - Whether to ignore interviews from this drive
   * @param {Object} [params.client] - Database query client (defaults to pool)
   * @returns {Promise<{ hasCollision: boolean, collisions: Object[] }>}
   */
  static async checkConcurrencyCollisions({
    assignments = [],
    driveId = null,
    ignoreCurrentDrive = false,
    client = pool
  }) {
    if (!assignments || assignments.length === 0) {
      return { hasCollision: false, collisions: [] };
    }

    // Extract all unique dates involved in proposed schedule
    const dates = [...new Set(assignments.map(a => normalizeDate(a.date)))].filter(Boolean);
    if (dates.length === 0) {
      return { hasCollision: false, collisions: [] };
    }

    // Query active interviews on these dates
    let queryText = `
      SELECT id, candidate_id, drive_id, interviewer_ids, room_id, date, start_time, end_time, status
      FROM interviews
      WHERE date = ANY($1) AND status != 'Cancelled'
    `;
    const queryParams = [dates];

    if (ignoreCurrentDrive && driveId) {
      queryText += ' AND drive_id != $2';
      queryParams.push(driveId);
    }

    const res = await client.query(queryText, queryParams);
    const existingInterviews = res.rows || [];

    if (existingInterviews.length === 0) {
      return { hasCollision: false, collisions: [] };
    }

    const collisions = [];

    for (const proposed of assignments) {
      const pDate = normalizeDate(proposed.date);
      const pStart = parseTimeString(proposed.startTime).totalMinutes;
      const pEnd = parseTimeString(proposed.endTime).totalMinutes;
      const pInterval = { start: pStart, end: pEnd };
      const pInterviewers = normalizeIdArray(proposed.interviewerIds);

      for (const existing of existingInterviews) {
        const eDate = normalizeDate(existing.date);
        if (pDate !== eDate) continue;

        // Skip comparing an assignment against itself if it has the same ID
        if (proposed.id && proposed.id === existing.id) continue;

        const eStart = parseTimeString(existing.start_time).totalMinutes;
        const eEnd = parseTimeString(existing.end_time).totalMinutes;
        const eInterval = { start: eStart, end: eEnd };

        if (!doIntervalsOverlap(pInterval, eInterval)) {
          continue;
        }

        // Direct interval overlap detected. Check resources involved:
        const eInterviewers = normalizeIdArray(existing.interviewer_ids);

        // 1. Candidate Collision
        if (proposed.candidateId && proposed.candidateId === existing.candidate_id) {
          collisions.push({
            type: 'CANDIDATE_DOUBLE_BOOKING',
            candidateId: proposed.candidateId,
            conflictingInterviewId: existing.id,
            date: pDate,
            proposedTime: `${proposed.startTime}-${proposed.endTime}`,
            existingTime: `${existing.start_time}-${existing.end_time}`,
            message: `Candidate ${proposed.candidateId} is already scheduled in interview ${existing.id} at ${existing.start_time}`
          });
        }

        // 2. Room Collision
        if (proposed.roomId && proposed.roomId === existing.room_id) {
          collisions.push({
            type: 'ROOM_DOUBLE_BOOKING',
            roomId: proposed.roomId,
            conflictingInterviewId: existing.id,
            date: pDate,
            proposedTime: `${proposed.startTime}-${proposed.endTime}`,
            existingTime: `${existing.start_time}-${existing.end_time}`,
            message: `Chamber/Room ${proposed.roomId} is already booked in interview ${existing.id} at ${existing.start_time}`
          });
        }

        // 3. Interviewer Collision
        const overlappingFaculty = pInterviewers.filter(id => eInterviewers.includes(id));
        if (overlappingFaculty.length > 0) {
          collisions.push({
            type: 'INTERVIEWER_DOUBLE_BOOKING',
            interviewerIds: overlappingFaculty,
            conflictingInterviewId: existing.id,
            date: pDate,
            proposedTime: `${proposed.startTime}-${proposed.endTime}`,
            existingTime: `${existing.start_time}-${existing.end_time}`,
            message: `Interviewer(s) [${overlappingFaculty.join(', ')}] are already booked in interview ${existing.id} at ${existing.start_time}`
          });
        }
      }
    }

    return {
      hasCollision: collisions.length > 0,
      collisions
    };
  }

  /**
   * Safely applies a schedule batch within a single atomic database transaction.
   * Performs pre-commit collision validation, inserts interviews, synchronizes candidates,
   * updates interviewer workload counters, updates drive metrics, and emits audit notification.
   * 
   * If any step fails or a collision is detected, issues ROLLBACK and leaves DB untouched.
   * 
   * @param {Object} params
   * @param {string} params.driveId - Recruitment drive ID
   * @param {Object[]} params.assignments - Formatted schedule assignments to commit
   * @param {Object} [params.options={}]
   * @param {boolean} [params.options.replaceExistingForDrive=false] - If true, replaces existing sessions for drive
   * @param {boolean} [params.options.skipConcurrencyCheck=false] - If true, bypasses live DB collision check
   * @param {boolean} [params.options.notify=true] - If true, writes an audit notification
   * @param {Object} [params.poolOverride] - Custom pool or InMemoryTransactionalPool instance
  /**
   * Validates internal consistency across assignments in the proposed batch
   * to ensure no internal collisions (candidate, room, or interviewer double-booking).
   * 
   * @param {Object[]} assignments 
   * @returns {Object[]} Array of violation objects
   */
  static validateBatchInternalConsistency(assignments = []) {
    const violations = [];
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      if (!a.date || !a.startTime || !a.endTime) continue;
      const aDate = normalizeDate(a.date);
      const aStart = parseTimeString(a.startTime).totalMinutes;
      const aEnd = parseTimeString(a.endTime).totalMinutes;
      const aIntv = { start: aStart, end: aEnd };
      const aInterviewers = normalizeIdArray(a.interviewerIds);

      for (let j = i + 1; j < assignments.length; j++) {
        const b = assignments[j];
        if (!b.date || !b.startTime || !b.endTime) continue;
        const bDate = normalizeDate(b.date);
        if (aDate !== bDate) continue;

        const bStart = parseTimeString(b.startTime).totalMinutes;
        const bEnd = parseTimeString(b.endTime).totalMinutes;
        const bIntv = { start: bStart, end: bEnd };

        if (doIntervalsOverlap(aIntv, bIntv)) {
          if (a.candidateId && a.candidateId === b.candidateId) {
            violations.push({
              code: 'CANDIDATE_DOUBLE_BOOKED',
              message: `Candidate ${a.candidateId} is double-booked within the batch between ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`
            });
          }
          if (a.roomId && a.roomId === b.roomId) {
            violations.push({
              code: 'ROOM_DOUBLE_BOOKED',
              message: `Room ${a.roomId} is double-booked within the batch between ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`
            });
          }
          const commonInts = aInterviewers.filter(id => normalizeIdArray(b.interviewerIds).includes(id));
          if (commonInts.length > 0) {
            violations.push({
              code: 'INTERVIEWER_DOUBLE_BOOKED',
              message: `Interviewer(s) [${commonInts.join(', ')}] are double-booked within the batch between ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`
            });
          }
        }
      }
    }
    return violations;
  }

  /**
   * Safely applies a schedule batch within a single atomic database transaction.
   * Performs pre-commit collision validation, inserts interviews, synchronizes candidates,
   * updates interviewer workload counters, updates drive metrics, and emits audit notification.
   * 
   * If any step fails or a collision is detected, issues ROLLBACK and leaves DB untouched.
   * 
   * @param {Object} params
   * @param {string} params.driveId - Recruitment drive ID
   * @param {Object[]} params.assignments - Formatted schedule assignments to commit
   * @param {Object} [params.options={}]
   * @param {boolean} [params.options.replaceExistingForDrive=false] - If true, replaces existing sessions for drive
   * @param {boolean} [params.options.skipConcurrencyCheck=false] - If true, bypasses live DB collision check
   * @param {boolean} [params.options.notify=true] - If true, writes an audit notification
   * @param {Object} [params.poolOverride] - Custom pool or InMemoryTransactionalPool instance
   * @returns {Promise<Object>} Result object with status, applied counts, or rollback details
   */
  static async applyScheduleTransaction({
    driveId,
    assignments = [],
    options = {},
    poolOverride = null
  }) {
    if (!driveId) {
      throw new Error('driveId is required for applying schedule transaction');
    }
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return {
        success: true,
        driveId,
        appliedCount: 0,
        message: 'No assignments provided to persist'
      };
    }

    const {
      replaceExistingForDrive = false,
      skipConcurrencyCheck = false,
      notify = true,
      context = {}
    } = options;

    const dbPool = poolOverride || pool;

    // Resolve resource context only if assignments specify required skills and context was not provided
    let contextToUse = context;
    const hasRequiredSkills = assignments.some(a => a.requiredSkills && a.requiredSkills.length > 0);
    if (hasRequiredSkills && !contextToUse.interviewers) {
      try {
        const intRes = await dbPool.query('SELECT id, name, skills FROM interviewers');
        contextToUse = { ...contextToUse, interviewers: intRes.rows || [] };
      } catch {
        // Fallback gracefully
      }
    }

    // 1. Stage 3 Internal Batch Hard-Constraint Verification
    const assignmentResults = validateScheduleBatch(assignments, contextToUse);
    const unaryViolations = Array.isArray(assignmentResults)
      ? assignmentResults.flatMap(r => r.violations || [])
      : [];
    const internalCollisions = this.validateBatchInternalConsistency(assignments);
    const allViolations = [...unaryViolations, ...internalCollisions];

    if (allViolations.length > 0) {
      return {
        success: false,
        rolledBack: true,
        reason: 'INTERNAL_VALIDATION_FAILED',
        error: `Batch hard-constraint validation failed: ${allViolations[0]?.message || 'Invalid assignments'}`,
        errors: allViolations
      };
    }

    // 3. Acquire dedicated client connection for atomic transaction
    const client = dbPool.connect ? await dbPool.connect() : dbPool;
    let inTransaction = false;

    try {
      await client.query('BEGIN');
      inTransaction = true;

      // 2. Pre-Commit Live Concurrency & Collision Check against Database
      if (!skipConcurrencyCheck) {
        const concurrencyCheck = await this.checkConcurrencyCollisions({
          assignments,
          driveId,
          ignoreCurrentDrive: replaceExistingForDrive,
          client
        });

        if (concurrencyCheck.hasCollision) {
          await client.query('ROLLBACK');
          inTransaction = false;
          return {
            success: false,
            rolledBack: true,
            reason: 'CONCURRENCY_COLLISION',
            error: 'Concurrency collision detected with active database bookings. Transaction aborted without mutating state.',
            collisions: concurrencyCheck.collisions
          };
        }
      }

      // Step A: If replaceExistingForDrive is requested, clean up previous active sessions for this drive
      if (replaceExistingForDrive) {
        const prevRes = await client.query(
          `SELECT id, candidate_id, interviewer_ids FROM interviews WHERE drive_id = $1 AND status != 'Cancelled'`,
          [driveId]
        );
        const previousInterviews = prevRes.rows || [];

        // Decrement workload counter for interviewers who had previous sessions
        for (const prev of previousInterviews) {
          const prevInterviewerIds = normalizeIdArray(prev.interviewer_ids);
          for (const intId of prevInterviewerIds) {
            await client.query(
              `UPDATE interviewers SET assigned_interviews = GREATEST(0, COALESCE(assigned_interviews, 0) - 1) WHERE id = $1`,
              [intId]
            );
          }
          if (prev.candidate_id) {
            await client.query(
              `UPDATE candidates SET status = 'Active', scheduled_time = NULL, room = NULL, interviewer = NULL WHERE id = $1`,
              [prev.candidate_id]
            );
          }
        }

        // Delete previous interviews for this drive
        await client.query(`DELETE FROM interviews WHERE drive_id = $1`, [driveId]);
        await client.query(`UPDATE drives SET total_scheduled = 0 WHERE id = $1`, [driveId]);
      }

      const interviewIds = [];
      const updatedCandidateIds = [];
      const interviewerWorkloadMap = new Map();

      // Step B: Insert interviews and synchronize candidates
      let seq = Date.now();
      for (const a of assignments) {
        const interviewId = a.id || `intv-${seq++}`;
        const pDate = normalizeDate(a.date);
        const interviewerIds = normalizeIdArray(a.interviewerIds);
        const interviewerNames = Array.isArray(a.interviewerNames) ? a.interviewerNames : [];
        const roomName = a.roomName || a.roomId || 'Virtual Chamber';
        const roundType = a.roundType || 'Technical';
        const roundTitle = a.roundTitle || `${roundType} · ${a.candidateName || a.candidateId}`;
        const durationStr = a.duration || `${a.durationMinutes || 45} min`;
        const scheduledTimeStr = `${pDate} ${a.startTime} - ${a.endTime}`;
        const interviewerDisplay = interviewerNames.length > 0 ? interviewerNames.join(', ') : interviewerIds.join(', ');

        // 1. Insert into interviews table
        await client.query(
          `INSERT INTO interviews (
            id, candidate_id, candidate_name, candidate_email, candidate_role,
            drive_id, interviewer_ids, interviewer_names, room_id, room_name,
            round_type, round_title, date, day_name, start_time, end_time,
            duration, status, evaluation_status, meeting_url, score, badge_text, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO UPDATE SET
            date = EXCLUDED.date,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            room_id = EXCLUDED.room_id,
            room_name = EXCLUDED.room_name,
            interviewer_ids = EXCLUDED.interviewer_ids,
            interviewer_names = EXCLUDED.interviewer_names,
            status = 'Scheduled'`,
          [
            interviewId,
            a.candidateId || null,
            a.candidateName || `Candidate ${a.candidateId}`,
            a.candidateEmail || '',
            a.candidateRole || '',
            driveId,
            JSON.stringify(interviewerIds),
            JSON.stringify(interviewerNames),
            a.roomId || null,
            roomName,
            roundType,
            roundTitle,
            pDate,
            a.dayName || '',
            a.startTime,
            a.endTime,
            durationStr,
            a.status || 'Scheduled',
            a.evaluationStatus || 'Pending',
            a.meetingUrl || `https://meet.arclight.io/trial-${a.candidateId || interviewId}`,
            a.score || null,
            a.badgeText || '',
            a.notes || ''
          ]
        );
        interviewIds.push(interviewId);

        // 2. Synchronize Candidate Record
        if (a.candidateId) {
          await client.query(
            `UPDATE candidates SET
              status = 'Scheduled',
              scheduled_time = $1,
              room = $2,
              interviewer = $3,
              stage = $4,
              current_round = $5,
              drive_id = COALESCE(drive_id, $6)
            WHERE id = $7`,
            [
              scheduledTimeStr,
              roomName,
              interviewerDisplay,
              roundType,
              roundTitle,
              driveId,
              a.candidateId
            ]
          );
          updatedCandidateIds.push(a.candidateId);
        }

        // Tally interviewer assignments for workload update
        for (const intId of interviewerIds) {
          interviewerWorkloadMap.set(intId, (interviewerWorkloadMap.get(intId) || 0) + 1);
        }
      }

      // Step C: Update Interviewer Workload Counters
      for (const [intId, count] of interviewerWorkloadMap.entries()) {
        await client.query(
          `UPDATE interviewers SET assigned_interviews = COALESCE(assigned_interviews, 0) + $1 WHERE id = $2`,
          [count, intId]
        );
      }

      // Step D: Update Drive Metrics
      await client.query(
        `UPDATE drives SET
          total_scheduled = COALESCE(total_scheduled, 0) + $1,
          status = 'Active'
        WHERE id = $2`,
        [assignments.length, driveId]
      );

      // Step E: Emit Coordinator Audit Notification
      if (notify) {
        const notifId = `notif-${Date.now()}`;
        const notifTitle = 'Recruitment Schedule Applied';
        const notifMessage = `Confirmed and safely locked ${assignments.length} interview sessions for drive "${driveId}".`;
        await client.query(
          `INSERT INTO notifications (id, title, message, description, type, read)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [notifId, notifTitle, notifMessage, notifMessage, 'success', false]
        );
      }

      // Step F: Commit Transaction Atomically
      await client.query('COMMIT');
      inTransaction = false;

      return {
        success: true,
        driveId,
        appliedCount: assignments.length,
        interviewIds,
        candidateIdsUpdated: updatedCandidateIds,
        facultyWorkloadsUpdated: Array.from(interviewerWorkloadMap.entries()).map(([id, delta]) => ({ id, delta })),
        appliedAt: new Date().toISOString()
      };

    } catch (err) {
      if (inTransaction) {
        try {
          await client.query('ROLLBACK');
        } catch (rbErr) {
          console.error('Failed to rollback transaction:', rbErr);
        }
      }
      return {
        success: false,
        rolledBack: true,
        reason: 'TRANSACTION_ERROR',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      };
    } finally {
      if (client.release) {
        client.release();
      }
    }
  }

  /**
   * Transactionally rolls back or cancels an applied schedule batch for a drive.
   * Reverts candidate statuses, decrements faculty workload counters,
   * updates drive metrics, and records an audit notification.
   * 
   * @param {Object} params
   * @param {string} params.driveId - Drive ID to rollback
   * @param {string[]} [params.interviewIds] - Optional specific interview IDs to cancel
   * @param {string} [params.reason='Administrative schedule reset'] - Reason for rollback
   * @param {boolean} [params.hardDelete=false] - If true, deletes rows; if false, marks as 'Cancelled'
   * @param {Object} [params.poolOverride] - Custom pool or InMemoryTransactionalPool
   * @returns {Promise<Object>}
   */
  static async rollbackSchedule({
    driveId,
    interviewIds = null,
    reason = 'Administrative schedule reset',
    hardDelete = false,
    poolOverride = null
  }) {
    if (!driveId) {
      throw new Error('driveId is required for rollbackSchedule');
    }

    const dbPool = poolOverride || pool;
    const client = dbPool.connect ? await dbPool.connect() : dbPool;
    let inTransaction = false;

    try {
      await client.query('BEGIN');
      inTransaction = true;

      // Identify target interviews
      let targetInterviews = [];
      if (Array.isArray(interviewIds) && interviewIds.length > 0) {
        const res = await client.query(
          `SELECT id, candidate_id, interviewer_ids FROM interviews WHERE id = ANY($1) AND status != 'Cancelled'`,
          [interviewIds]
        );
        targetInterviews = res.rows || [];
      } else {
        const res = await client.query(
          `SELECT id, candidate_id, interviewer_ids FROM interviews WHERE drive_id = $1 AND status != 'Cancelled'`,
          [driveId]
        );
        targetInterviews = res.rows || [];
      }

      if (targetInterviews.length === 0) {
        await client.query('COMMIT');
        inTransaction = false;
        return {
          success: true,
          driveId,
          rolledBackCount: 0,
          message: 'No active scheduled interviews found to rollback'
        };
      }

      const affectedInterviewIds = targetInterviews.map(i => i.id);

      // 1. Revert candidate records
      for (const item of targetInterviews) {
        if (item.candidate_id) {
          await client.query(
            `UPDATE candidates SET
              status = 'Active',
              scheduled_time = NULL,
              room = NULL,
              interviewer = NULL
            WHERE id = $1`,
            [item.candidate_id]
          );
        }
      }

      // 2. Decrement interviewer workload counters
      for (const item of targetInterviews) {
        const intIds = normalizeIdArray(item.interviewer_ids);
        for (const intId of intIds) {
          await client.query(
            `UPDATE interviewers SET assigned_interviews = GREATEST(0, COALESCE(assigned_interviews, 0) - 1) WHERE id = $1`,
            [intId]
          );
        }
      }

      // 3. Delete or cancel interviews
      if (hardDelete) {
        await client.query(`DELETE FROM interviews WHERE id = ANY($1)`, [affectedInterviewIds]);
      } else {
        await client.query(
          `UPDATE interviews SET
            status = 'Cancelled',
            notes = COALESCE(notes, '') || ' [Cancelled: ' || $1 || ']'
          WHERE id = ANY($2)`,
          [reason, affectedInterviewIds]
        );
      }

      // 4. Decrement drive metrics
      await client.query(
        `UPDATE drives SET
          total_scheduled = GREATEST(0, COALESCE(total_scheduled, 0) - $1)
        WHERE id = $2`,
        [targetInterviews.length, driveId]
      );

      // 5. Insert notification
      const notifId = `notif-${Date.now()}`;
      await client.query(
        `INSERT INTO notifications (id, title, message, description, type, read)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          notifId,
          'Recruitment Schedule Rolled Back',
          `Rolled back ${targetInterviews.length} sessions for drive "${driveId}". Reason: ${reason}`,
          `Rolled back ${targetInterviews.length} sessions for drive "${driveId}". Reason: ${reason}`,
          'warning',
          false
        ]
      );

      await client.query('COMMIT');
      inTransaction = false;

      return {
        success: true,
        driveId,
        rolledBackCount: targetInterviews.length,
        affectedInterviewIds,
        reason
      };

    } catch (err) {
      if (inTransaction) {
        try {
          await client.query('ROLLBACK');
        } catch (rbErr) {
          console.error('Failed to rollback transaction:', rbErr);
        }
      }
      return {
        success: false,
        rolledBack: true,
        reason: 'TRANSACTION_ERROR',
        error: err.message
      };
    } finally {
      if (client.release) {
        client.release();
      }
    }
  }

  /**
   * Fetches real-time scheduling status, candidate fulfillment metrics,
   * interviewer workload distribution, and confirmed sessions for a drive.
   * 
   * @param {Object} params
   * @param {string} params.driveId
   * @param {Object} [params.poolOverride]
   * @returns {Promise<Object>}
   */
  static async getScheduleStatus({ driveId, poolOverride = null }) {
    if (!driveId) {
      throw new Error('driveId is required for getScheduleStatus');
    }

    const dbPool = poolOverride || pool;

    const [driveRes, candRes, intvRes, facultyRes] = await Promise.all([
      dbPool.query('SELECT * FROM drives WHERE id = $1', [driveId]),
      dbPool.query('SELECT id, name, status, stage, scheduled_time, room, interviewer FROM candidates WHERE drive_id = $1', [driveId]),
      dbPool.query('SELECT * FROM interviews WHERE drive_id = $1 ORDER BY date ASC, start_time ASC', [driveId]),
      dbPool.query('SELECT id, name, assigned_interviews, max_interviews_per_day, status FROM interviewers')
    ]);

    const drive = driveRes.rows[0] ? rowToCamel(driveRes.rows[0]) : null;
    const candidates = (candRes.rows || []).map(rowToCamel);
    const interviews = (intvRes.rows || []).map(rowToCamel);
    const interviewers = (facultyRes.rows || []).map(rowToCamel);

    const totalCandidates = candidates.length;
    const scheduledCandidates = candidates.filter(c => c.status === 'Scheduled').length;
    const pendingCandidates = candidates.filter(c => c.status !== 'Scheduled').length;
    const confirmedInterviews = interviews.filter(i => i.status === 'Scheduled').length;

    return {
      success: true,
      driveId,
      driveName: drive?.name || 'Recruitment Drive',
      status: drive?.status || 'Unknown',
      metrics: {
        totalCandidates,
        scheduledCandidates,
        pendingCandidates,
        confirmedInterviews,
        fulfillmentRate: totalCandidates > 0
          ? `${Math.round((scheduledCandidates / totalCandidates) * 100)}%`
          : '100%'
      },
      candidates,
      interviews,
      facultyUtilization: interviewers.map(f => ({
        id: f.id,
        name: f.name,
        assignedInterviews: f.assignedInterviews || 0,
        maxDaily: f.maxInterviewsPerDay || 3,
        status: f.status
      }))
    };
  }
}

/**
 * InMemoryTransactionalPool
 * 
 * High-performance, isolated in-memory transactional database adapter for Stage 7 unit testing.
 * Implements BEGIN, COMMIT, ROLLBACK semantics with table snapshots, SQL parsing,
 * and simulated database failures.
 */
export class InMemoryTransactionalPool {
  constructor(initialData = {}) {
    this.tables = {
      drives: initialData.drives ? JSON.parse(JSON.stringify(initialData.drives)) : [],
      candidates: initialData.candidates ? JSON.parse(JSON.stringify(initialData.candidates)) : [],
      interviewers: initialData.interviewers ? JSON.parse(JSON.stringify(initialData.interviewers)) : [],
      rooms: initialData.rooms ? JSON.parse(JSON.stringify(initialData.rooms)) : [],
      interviews: initialData.interviews ? JSON.parse(JSON.stringify(initialData.interviews)) : [],
      notifications: initialData.notifications ? JSON.parse(JSON.stringify(initialData.notifications)) : []
    };
    this.failOnNextQuery = false;
  }

  setFailOnNextQuery(fail = true) {
    this.failOnNextQuery = fail;
  }

  async connect() {
    return new InMemoryTransactionalClient(this);
  }

  async query(sql, params = []) {
    const client = new InMemoryTransactionalClient(this);
    return client.query(sql, params);
  }
}

class InMemoryTransactionalClient {
  constructor(pool) {
    this.pool = pool;
    this.snapshot = null;
    this.inTransaction = false;
  }

  async query(sql, params = []) {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    if (upper === 'BEGIN') {
      this.snapshot = JSON.parse(JSON.stringify(this.pool.tables));
      this.inTransaction = true;
      return { rowCount: 0, rows: [] };
    }

    if (upper === 'COMMIT') {
      this.snapshot = null;
      this.inTransaction = false;
      return { rowCount: 0, rows: [] };
    }

    if (upper === 'ROLLBACK') {
      if (this.snapshot) {
        this.pool.tables = JSON.parse(JSON.stringify(this.snapshot));
        this.snapshot = null;
      }
      this.inTransaction = false;
      return { rowCount: 0, rows: [] };
    }

    if (this.pool.failOnNextQuery) {
      this.pool.failOnNextQuery = false;
      throw new Error('Simulated database error / connection severed');
    }

    // --- SELECT FROM interviews (Concurrency Check & Status) ---
    if (upper.startsWith('SELECT') && upper.includes('FROM INTERVIEWS')) {
      let rows = [...this.pool.tables.interviews];

      if (upper.includes('DATE = ANY($1)')) {
        const dates = params[0] || [];
        rows = rows.filter(r => dates.includes(normalizeDate(r.date)) && r.status !== 'Cancelled');
        if (upper.includes('DRIVE_ID != $2')) {
          rows = rows.filter(r => r.drive_id !== params[1]);
        }
      } else if (upper.includes('DRIVE_ID = $1')) {
        rows = rows.filter(r => r.drive_id === params[0]);
        if (upper.includes("STATUS != 'CANCELLED'")) {
          rows = rows.filter(r => r.status !== 'Cancelled');
        }
      } else if (upper.includes('ID = ANY($1)')) {
        const ids = params[0] || [];
        rows = rows.filter(r => ids.includes(r.id));
      }
      return { rowCount: rows.length, rows };
    }

    // --- SELECT FROM drives ---
    if (upper.startsWith('SELECT') && upper.includes('FROM DRIVES')) {
      if (upper.includes('WHERE ID = $1')) {
        const match = this.pool.tables.drives.filter(d => d.id === params[0]);
        return { rowCount: match.length, rows: match };
      }
      return { rowCount: this.pool.tables.drives.length, rows: this.pool.tables.drives };
    }

    // --- SELECT FROM candidates ---
    if (upper.startsWith('SELECT') && upper.includes('FROM CANDIDATES')) {
      if (upper.includes('WHERE DRIVE_ID = $1')) {
        const match = this.pool.tables.candidates.filter(c => c.drive_id === params[0]);
        return { rowCount: match.length, rows: match };
      }
      return { rowCount: this.pool.tables.candidates.length, rows: this.pool.tables.candidates };
    }

    // --- SELECT FROM interviewers ---
    if (upper.startsWith('SELECT') && upper.includes('FROM INTERVIEWERS')) {
      return { rowCount: this.pool.tables.interviewers.length, rows: this.pool.tables.interviewers };
    }

    // --- INSERT INTO interviews ---
    if (upper.startsWith('INSERT INTO INTERVIEWS')) {
      const interviewObj = {
        id: params[0],
        candidate_id: params[1],
        candidate_name: params[2],
        candidate_email: params[3],
        candidate_role: params[4],
        drive_id: params[5],
        interviewer_ids: params[6],
        interviewer_names: params[7],
        room_id: params[8],
        room_name: params[9],
        round_type: params[10],
        round_title: params[11],
        date: params[12],
        day_name: params[13],
        start_time: params[14],
        end_time: params[15],
        duration: params[16],
        status: params[17] || 'Scheduled',
        evaluation_status: params[18] || 'Pending',
        meeting_url: params[19],
        score: params[20],
        badge_text: params[21],
        notes: params[22]
      };
      const existingIdx = this.pool.tables.interviews.findIndex(i => i.id === interviewObj.id);
      if (existingIdx >= 0) {
        this.pool.tables.interviews[existingIdx] = {
          ...this.pool.tables.interviews[existingIdx],
          ...interviewObj
        };
      } else {
        this.pool.tables.interviews.push(interviewObj);
      }
      return { rowCount: 1, rows: [interviewObj] };
    }

    // --- UPDATE candidates ---
    if (upper.startsWith('UPDATE CANDIDATES')) {
      if (upper.includes("STATUS = 'SCHEDULED'")) {
        // [scheduledTimeStr, roomName, interviewerDisplay, roundType, roundTitle, driveId, candidateId]
        const candId = params[6];
        const cand = this.pool.tables.candidates.find(c => c.id === candId);
        if (cand) {
          cand.status = 'Scheduled';
          cand.scheduled_time = params[0];
          cand.room = params[1];
          cand.interviewer = params[2];
          cand.stage = params[3];
          cand.current_round = params[4];
          cand.drive_id = cand.drive_id || params[5];
        }
        return { rowCount: cand ? 1 : 0, rows: [] };
      } else if (upper.includes("STATUS = 'ACTIVE'")) {
        // Rollback update: SET status = 'Active', scheduled_time = NULL... WHERE id = $1
        const candId = params[0];
        const cand = this.pool.tables.candidates.find(c => c.id === candId);
        if (cand) {
          cand.status = 'Active';
          cand.scheduled_time = null;
          cand.room = null;
          cand.interviewer = null;
        }
        return { rowCount: cand ? 1 : 0, rows: [] };
      }
    }

    // --- UPDATE interviewers ---
    if (upper.startsWith('UPDATE INTERVIEWERS')) {
      if (upper.includes('COALESCE(ASSIGNED_INTERVIEWS, 0) + $1')) {
        const delta = params[0];
        const intId = params[1];
        const interviewer = this.pool.tables.interviewers.find(i => i.id === intId);
        if (interviewer) {
          interviewer.assigned_interviews = (interviewer.assigned_interviews || 0) + delta;
        }
        return { rowCount: interviewer ? 1 : 0, rows: [] };
      } else if (upper.includes('GREATEST(0, COALESCE(ASSIGNED_INTERVIEWS, 0) - 1)')) {
        const intId = params[0];
        const interviewer = this.pool.tables.interviewers.find(i => i.id === intId);
        if (interviewer) {
          interviewer.assigned_interviews = Math.max(0, (interviewer.assigned_interviews || 0) - 1);
        }
        return { rowCount: interviewer ? 1 : 0, rows: [] };
      }
    }

    // --- UPDATE drives ---
    if (upper.startsWith('UPDATE DRIVES')) {
      if (upper.includes('COALESCE(TOTAL_SCHEDULED, 0) + $1')) {
        const count = params[0];
        const driveId = params[1];
        const drive = this.pool.tables.drives.find(d => d.id === driveId);
        if (drive) {
          drive.total_scheduled = (drive.total_scheduled || 0) + count;
          drive.status = 'Active';
        }
        return { rowCount: drive ? 1 : 0, rows: [] };
      } else if (upper.includes('TOTAL_SCHEDULED = 0')) {
        const driveId = params[0];
        const drive = this.pool.tables.drives.find(d => d.id === driveId);
        if (drive) drive.total_scheduled = 0;
        return { rowCount: drive ? 1 : 0, rows: [] };
      } else if (upper.includes('GREATEST(0, COALESCE(TOTAL_SCHEDULED, 0) - $1)')) {
        const count = params[0];
        const driveId = params[1];
        const drive = this.pool.tables.drives.find(d => d.id === driveId);
        if (drive) {
          drive.total_scheduled = Math.max(0, (drive.total_scheduled || 0) - count);
        }
        return { rowCount: drive ? 1 : 0, rows: [] };
      }
    }

    // --- INSERT INTO notifications ---
    if (upper.startsWith('INSERT INTO NOTIFICATIONS')) {
      const is6Param = params.length >= 6;
      let notifType = (is6Param ? params[4] : params[3]) || 'info';
      if (!notifType || notifType.includes(' ')) {
        if (upper.includes("'SUCCESS'")) notifType = 'success';
        else if (upper.includes("'WARNING'")) notifType = 'warning';
        else notifType = 'info';
      }
      const notifObj = {
        id: params[0],
        title: params[1],
        message: params[2],
        description: is6Param ? params[3] : params[2],
        type: notifType,
        read: (is6Param ? params[5] : params[4]) !== undefined ? (is6Param ? params[5] : params[4]) : false
      };
      this.pool.tables.notifications.push(notifObj);
      return { rowCount: 1, rows: [notifObj] };
    }

    // --- DELETE FROM interviews ---
    if (upper.startsWith('DELETE FROM INTERVIEWS')) {
      if (upper.includes('WHERE DRIVE_ID = $1')) {
        const driveId = params[0];
        const initialLen = this.pool.tables.interviews.length;
        this.pool.tables.interviews = this.pool.tables.interviews.filter(i => i.drive_id !== driveId);
        return { rowCount: initialLen - this.pool.tables.interviews.length, rows: [] };
      } else if (upper.includes('ID = ANY($1)')) {
        const ids = params[0] || [];
        const initialLen = this.pool.tables.interviews.length;
        this.pool.tables.interviews = this.pool.tables.interviews.filter(i => !ids.includes(i.id));
        return { rowCount: initialLen - this.pool.tables.interviews.length, rows: [] };
      }
    }

    // --- UPDATE interviews (Cancel) ---
    if (upper.startsWith('UPDATE INTERVIEWS') && upper.includes("STATUS = 'CANCELLED'")) {
      const reason = params[0];
      const ids = params[1] || [];
      let updatedCount = 0;
      for (const inv of this.pool.tables.interviews) {
        if (ids.includes(inv.id)) {
          inv.status = 'Cancelled';
          inv.notes = `${inv.notes || ''} [Cancelled: ${reason}]`;
          updatedCount++;
        }
      }
      return { rowCount: updatedCount, rows: [] };
    }

    return { rowCount: 0, rows: [] };
  }

  release() {
    // Release mock client back to pool
  }
}
