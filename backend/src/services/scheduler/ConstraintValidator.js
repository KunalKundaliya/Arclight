/**
 * ArcLight - Hard-Constraint Validator
 * 
 * Deterministic constraint validator for recruitment interview assignments.
 * Validates proposed interview pairings against:
 * 1. Candidate availability and existing booking collisions.
 * 2. Interviewer availability, status, weekly schedule, daily limits, and double-bookings.
 * 3. Room availability, maintenance status, and double-bookings.
 * 4. Interview duration and operating-hour boundaries.
 * 5. Half-open availability-window containment.
 * 6. Interviewer-specific separation buffer requirements.
 * 7. Required interviewer technical skills.
 * 8. Required panel size and composition.
 * 9. Room capacity, type, and hardware/equipment requirements.
 * 10. Protection of existing confirmed/locked bookings.
 * 
 * Architectural Guarantees:
 * - Uses Stage 2 IntervalUtils for half-open interval math [start, end).
 * - Adjacent interviews meeting at boundaries (endA === startB) do NOT overlap.
 * - Interviewer buffers are resource-specific and strictly decoupled from room occupancy.
 * - Uses TimezoneUtils for IANA timezone validation; rejects silent UTC fallbacks.
 * - Non-short-circuiting: collects all applicable violations across all constraints.
 */

import {
  parseDateString,
  parseTimeString,
  validateTimezone
} from './TimezoneUtils.js';

import {
  doIntervalsOverlap,
  areIntervalsAdjacent,
  isIntervalWithinWindow,
  getIntervalGap,
  hasBufferViolation
} from './IntervalUtils.js';

/**
 * Standardized, stable violation codes.
 */
export const VIOLATION_CODES = Object.freeze({
  // Candidate
  CANDIDATE_DOUBLE_BOOKED: 'CANDIDATE_DOUBLE_BOOKED',
  CANDIDATE_UNAVAILABLE: 'CANDIDATE_UNAVAILABLE',
  
  // Interviewer
  INTERVIEWER_DOUBLE_BOOKED: 'INTERVIEWER_DOUBLE_BOOKED',
  INTERVIEWER_STATUS_UNAVAILABLE: 'INTERVIEWER_STATUS_UNAVAILABLE',
  INTERVIEWER_WEEKLY_UNAVAILABLE: 'INTERVIEWER_WEEKLY_UNAVAILABLE',
  INTERVIEWER_DAILY_LIMIT_EXCEEDED: 'INTERVIEWER_DAILY_LIMIT_EXCEEDED',
  INTERVIEWER_BUFFER_VIOLATION: 'INTERVIEWER_BUFFER_VIOLATION',
  INTERVIEWER_SKILLS_DEFICIENT: 'INTERVIEWER_SKILLS_DEFICIENT',
  PANEL_SIZE_DEFICIENT: 'PANEL_SIZE_DEFICIENT',
  
  // Room
  ROOM_DOUBLE_BOOKED: 'ROOM_DOUBLE_BOOKED',
  ROOM_STATUS_UNAVAILABLE: 'ROOM_STATUS_UNAVAILABLE',
  ROOM_CAPACITY_EXCEEDED: 'ROOM_CAPACITY_EXCEEDED',
  ROOM_TYPE_MISMATCH: 'ROOM_TYPE_MISMATCH',
  ROOM_EQUIPMENT_MISSING: 'ROOM_EQUIPMENT_MISSING',
  
  // Timing & Environment
  INVALID_TIME_INTERVAL: 'INVALID_TIME_INTERVAL',
  INVALID_DURATION: 'INVALID_DURATION',
  OPERATING_HOURS_EXCEEDED: 'OPERATING_HOURS_EXCEEDED',
  WINDOW_CONTAINMENT_VIOLATION: 'WINDOW_CONTAINMENT_VIOLATION',
  INVALID_TIMEZONE: 'INVALID_TIMEZONE',
  
  // Bookings
  BOOKING_LOCKED_CONFLICT: 'BOOKING_LOCKED_CONFLICT'
});

/**
 * Factory for creating structured violation descriptors.
 */
export function createViolation(code, message, resourceType = null, resourceId = null, details = {}) {
  return {
    code,
    message,
    severity: 'error',
    resourceType,
    resourceId,
    details
  };
}

/**
 * Helper to normalize date values (Date objects or strings) into 'YYYY-MM-DD'.
 */
export function normalizeDateStr(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.trim().split('T')[0];
  }
  if (dateVal instanceof Date) {
    const y = dateVal.getUTCFullYear();
    const m = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(dateVal);
}

/**
 * Computes day-of-week string ('Monday', 'Tuesday', ...) for a given YYYY-MM-DD.
 */
export function getDayOfWeekFromDate(dateStr) {
  const { year, month, day } = parseDateString(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getUTCDay()];
}

/**
 * Normalizes an interview entity into start and end minute-of-day offsets.
 */
export function extractMinuteInterval(entity) {
  const startTime = entity.startTime || entity.start_time;
  const endTime = entity.endTime || entity.end_time;
  if (!startTime || !endTime) return null;
  const s = parseTimeString(startTime);
  const e = parseTimeString(endTime);
  return {
    start: s.totalMinutes,
    end: e.totalMinutes,
    startTime,
    endTime
  };
}

/**
 * Helper to find candidate entity in context if not embedded in assignment.
 */
function resolveCandidate(assignment, context) {
  if (assignment.candidate && typeof assignment.candidate === 'object') {
    return assignment.candidate;
  }
  const id = assignment.candidateId || assignment.candidate_id;
  if (!id || !context.candidates) return null;
  if (Array.isArray(context.candidates)) {
    return context.candidates.find(c => c.id === id) || null;
  }
  return context.candidates[id] || null;
}

/**
 * Helper to resolve interviewer entities in context.
 */
function resolveInterviewers(assignment, context) {
  if (Array.isArray(assignment.interviewers) && assignment.interviewers.length > 0) {
    return assignment.interviewers;
  }
  const rawIds = assignment.interviewerIds || assignment.interviewer_ids || (assignment.interviewerId ? [assignment.interviewerId] : []);
  if (!Array.isArray(rawIds) || rawIds.length === 0) return [];
  if (!context.interviewers) {
    return rawIds.map(id => ({ id, name: `Interviewer ${id}` }));
  }
  if (Array.isArray(context.interviewers)) {
    return rawIds.map(id => context.interviewers.find(i => i.id === id) || { id, name: `Interviewer ${id}` });
  }
  return rawIds.map(id => context.interviewers[id] || { id, name: `Interviewer ${id}` });
}

/**
 * Helper to resolve room entity in context.
 */
function resolveRoom(assignment, context) {
  if (assignment.room && typeof assignment.room === 'object') {
    return assignment.room;
  }
  const id = assignment.roomId || assignment.room_id;
  if (!id || !context.rooms) return null;
  if (Array.isArray(context.rooms)) {
    return context.rooms.find(r => r.id === id) || null;
  }
  return context.rooms[id] || null;
}

// =============================================================================
// INDIVIDUAL CONSTRAINT VALIDATORS
// =============================================================================

/**
 * Constraint: Validates timezone configuration if specified or required.
 */
export function validateTimezoneConfig(assignment, context) {
  const violations = [];
  const tz = context.timezone || assignment.timezone;
  if (tz !== undefined) {
    try {
      validateTimezone(tz);
    } catch (err) {
      violations.push(createViolation(
        VIOLATION_CODES.INVALID_TIMEZONE,
        `Invalid or unsupported IANA timezone identifier: "${tz}". ${err.message}`,
        'timezone',
        String(tz)
      ));
    }
  }
  return violations;
}

/**
 * Constraint: Validates interval boundaries, duration, and operating hours.
 */
export function validateIntervalTiming(assignment, context) {
  const violations = [];
  const startTime = assignment.startTime || assignment.start_time;
  const endTime = assignment.endTime || assignment.end_time;

  if (!startTime || !endTime) {
    violations.push(createViolation(
      VIOLATION_CODES.INVALID_TIME_INTERVAL,
      'Proposed assignment must specify both startTime and endTime in HH:mm format',
      'assignment',
      assignment.id
    ));
    return violations;
  }

  let sTime;
  let eTime;
  try {
    sTime = parseTimeString(startTime);
    eTime = parseTimeString(endTime);
  } catch (err) {
    violations.push(createViolation(
      VIOLATION_CODES.INVALID_TIME_INTERVAL,
      `Malformed time string: ${err.message}`,
      'assignment',
      assignment.id
    ));
    return violations;
  }

  if (sTime.totalMinutes >= eTime.totalMinutes) {
    violations.push(createViolation(
      VIOLATION_CODES.INVALID_TIME_INTERVAL,
      `startTime (${startTime}) must be strictly earlier than endTime (${endTime}) in half-open interval [start, end)`,
      'assignment',
      assignment.id,
      { startTime, endTime }
    ));
    return violations;
  }

  const durationMin = eTime.totalMinutes - sTime.totalMinutes;
  const expectedDuration = assignment.durationMinutes || context.durationMinutes;
  if (expectedDuration !== undefined && typeof expectedDuration === 'number') {
    if (durationMin !== expectedDuration) {
      violations.push(createViolation(
        VIOLATION_CODES.INVALID_DURATION,
        `Interview duration (${durationMin} min) does not match the configured round duration (${expectedDuration} min)`,
        'assignment',
        assignment.id,
        { actualDuration: durationMin, expectedDuration }
      ));
    }
  }

  // Operating Hours boundary check
  const operatingHours = context.operatingHours || assignment.operatingHours;
  if (operatingHours && operatingHours.startTime && operatingHours.endTime) {
    try {
      const opStart = parseTimeString(operatingHours.startTime);
      const opEnd = parseTimeString(operatingHours.endTime);
      const assignmentInterval = { start: sTime.totalMinutes, end: eTime.totalMinutes };
      const opWindow = { start: opStart.totalMinutes, end: opEnd.totalMinutes };

      if (!isIntervalWithinWindow(assignmentInterval, opWindow)) {
        violations.push(createViolation(
          VIOLATION_CODES.OPERATING_HOURS_EXCEEDED,
          `Proposed interval [${startTime}, ${endTime}) extends beyond daily operating hours [${operatingHours.startTime}, ${operatingHours.endTime})`,
          'operatingHours',
          null,
          { proposed: `${startTime}-${endTime}`, operatingWindow: `${operatingHours.startTime}-${operatingHours.endTime}` }
        ));
      }
    } catch {
      // Ignore parse errors on optional operating hours if malformed
    }
  }

  return violations;
}

/**
 * Constraint: Validates candidate double-booking and availability windows.
 */
export function validateCandidateConstraints(assignment, context) {
  const violations = [];
  const candidateId = assignment.candidateId || assignment.candidate_id;
  if (!candidateId) return violations;

  const dateStr = normalizeDateStr(assignment.date);
  const targetInterval = extractMinuteInterval(assignment);
  if (!targetInterval || !dateStr) return violations;

  const candidate = resolveCandidate(assignment, context);
  const candidateName = candidate?.name || assignment.candidateName || candidateId;

  // 1. Candidate Double-Booking against existing interviews
  const existingList = context.existingInterviews || [];
  for (const existing of existingList) {
    if (existing.id && assignment.id && existing.id === assignment.id) continue;
    if (existing.status && existing.status.toLowerCase() === 'cancelled') continue;

    const exCandidateId = existing.candidateId || existing.candidate_id;
    if (exCandidateId !== candidateId) continue;

    const exDate = normalizeDateStr(existing.date);
    if (exDate !== dateStr) continue;

    const exInterval = extractMinuteInterval(existing);
    if (!exInterval) continue;

    if (doIntervalsOverlap(targetInterval, exInterval)) {
      violations.push(createViolation(
        VIOLATION_CODES.CANDIDATE_DOUBLE_BOOKED,
        `Candidate "${candidateName}" (${candidateId}) is already scheduled on ${dateStr} at [${exInterval.startTime}, ${exInterval.endTime}) in booking ${existing.id || 'existing'}`,
        'candidate',
        candidateId,
        {
          date: dateStr,
          conflictingInterviewId: existing.id,
          conflictingTime: `${exInterval.startTime}-${exInterval.endTime}`,
          proposedTime: `${targetInterval.startTime}-${targetInterval.endTime}`
        }
      ));
    }
  }

  // 2. Candidate Availability Windows (if explicitly supported/provided on candidate)
  if (candidate && Array.isArray(candidate.availabilityWindows) && candidate.availabilityWindows.length > 0) {
    const dayOfWeek = getDayOfWeekFromDate(dateStr);
    const applicableWindows = candidate.availabilityWindows.filter(w => {
      if (w.date && normalizeDateStr(w.date) !== dateStr) return false;
      if (w.dayOfWeek && w.dayOfWeek.toLowerCase() !== dayOfWeek.toLowerCase()) return false;
      return true;
    });

    if (applicableWindows.length > 0) {
      const fitsAny = applicableWindows.some(w => {
        const winInterval = extractMinuteInterval(w);
        return winInterval && isIntervalWithinWindow(targetInterval, winInterval);
      });

      if (!fitsAny) {
        violations.push(createViolation(
          VIOLATION_CODES.CANDIDATE_UNAVAILABLE,
          `Candidate "${candidateName}" is unavailable at [${targetInterval.startTime}, ${targetInterval.endTime}) on ${dateStr} according to configured candidate availability windows`,
          'candidate',
          candidateId,
          { date: dateStr, proposedTime: `${targetInterval.startTime}-${targetInterval.endTime}` }
        ));
      }
    }
  }

  return violations;
}

/**
 * Constraint: Validates interviewer status, daily limits, double-bookings, weekly slots, and buffers.
 */
export function validateInterviewerConstraints(assignment, context) {
  const violations = [];
  const interviewers = resolveInterviewers(assignment, context);
  if (interviewers.length === 0) return violations;

  const dateStr = normalizeDateStr(assignment.date);
  const targetInterval = extractMinuteInterval(assignment);
  if (!targetInterval || !dateStr) return violations;

  const dayOfWeek = getDayOfWeekFromDate(dateStr);
  const existingList = context.existingInterviews || [];
  const bufferMinutes = context.interviewerBufferMinutes !== undefined ? context.interviewerBufferMinutes : 15;

  for (const interviewer of interviewers) {
    const intId = interviewer.id;
    const intName = interviewer.name || intId;

    // 1. Status Check (e.g. 'On Leave', 'Unavailable')
    if (interviewer.status) {
      const st = interviewer.status.toLowerCase();
      if (st === 'on leave' || st === 'unavailable' || st === 'inactive') {
        violations.push(createViolation(
          VIOLATION_CODES.INTERVIEWER_STATUS_UNAVAILABLE,
          `Interviewer "${intName}" (${intId}) cannot be scheduled because their status is "${interviewer.status}"`,
          'interviewer',
          intId,
          { status: interviewer.status }
        ));
      }
    }

    // 2. Weekly Availability Schedule (e.g. { "Monday": ["09:00", "10:00"] })
    const weekly = interviewer.weeklyAvailability || interviewer.weekly_availability;
    if (weekly && typeof weekly === 'object' && Object.keys(weekly).length > 0) {
      const daySlots = weekly[dayOfWeek];
      if (Array.isArray(daySlots)) {
        if (daySlots.length === 0) {
          violations.push(createViolation(
            VIOLATION_CODES.INTERVIEWER_WEEKLY_UNAVAILABLE,
            `Interviewer "${intName}" has no available hours on ${dayOfWeek}s according to their weekly schedule`,
            'interviewer',
            intId,
            { dayOfWeek, scheduledSlots: [] }
          ));
        } else {
          // Check if slot start matches or fits inside window
          const slotMatches = daySlots.some(s => {
            if (typeof s === 'string') return s === targetInterval.startTime;
            if (typeof s === 'object' && s.startTime && s.endTime) {
              const win = extractMinuteInterval(s);
              return win && isIntervalWithinWindow(targetInterval, win);
            }
            return false;
          });

          if (!slotMatches) {
            violations.push(createViolation(
              VIOLATION_CODES.INTERVIEWER_WEEKLY_UNAVAILABLE,
              `Interviewer "${intName}" is not available for interview start time ${targetInterval.startTime} on ${dayOfWeek}. Available slots: ${daySlots.join(', ')}`,
              'interviewer',
              intId,
              { dayOfWeek, requestedStartTime: targetInterval.startTime, availableSlots: daySlots }
            ));
          }
        }
      }
    }

    // 3. Existing Bookings on Same Date (Double-Booking, Daily Cap, Buffer Violation)
    let dailyAssignedCount = 0;

    for (const existing of existingList) {
      if (existing.id && assignment.id && existing.id === assignment.id) continue;
      if (existing.status && existing.status.toLowerCase() === 'cancelled') continue;

      const exIds = existing.interviewerIds || existing.interviewer_ids || (existing.interviewerId ? [existing.interviewerId] : []);
      if (!Array.isArray(exIds) || !exIds.includes(intId)) continue;

      const exDate = normalizeDateStr(existing.date);
      if (exDate !== dateStr) continue;

      dailyAssignedCount += 1;

      const exInterval = extractMinuteInterval(existing);
      if (!exInterval) continue;

      // Double-booking collision
      if (doIntervalsOverlap(targetInterval, exInterval)) {
        violations.push(createViolation(
          VIOLATION_CODES.INTERVIEWER_DOUBLE_BOOKED,
          `Interviewer "${intName}" (${intId}) is already booked on ${dateStr} at [${exInterval.startTime}, ${exInterval.endTime}) in booking ${existing.id || 'existing'}`,
          'interviewer',
          intId,
          {
            date: dateStr,
            conflictingInterviewId: existing.id,
            conflictingTime: `${exInterval.startTime}-${exInterval.endTime}`,
            proposedTime: `${targetInterval.startTime}-${targetInterval.endTime}`
          }
        ));
      } else if (bufferMinutes > 0 && hasBufferViolation(targetInterval, exInterval, bufferMinutes)) {
        // Buffer separation violation
        const actualGap = getIntervalGap(targetInterval, exInterval);
        violations.push(createViolation(
          VIOLATION_CODES.INTERVIEWER_BUFFER_VIOLATION,
          `Interviewer "${intName}" requires a ${bufferMinutes}-minute rest buffer between interviews. Actual gap with booking ${existing.id || 'existing'} is only ${actualGap} minute(s)`,
          'interviewer',
          intId,
          {
            conflictingInterviewId: existing.id,
            requiredBufferMinutes: bufferMinutes,
            actualGapMinutes: actualGap,
            conflictingTime: `${exInterval.startTime}-${exInterval.endTime}`,
            proposedTime: `${targetInterval.startTime}-${targetInterval.endTime}`
          }
        ));
      }
    }

    // Daily Limit Cap (max_interviews_per_day)
    const maxPerDay = interviewer.maxInterviewsPerDay || interviewer.max_interviews_per_day;
    if (typeof maxPerDay === 'number' && dailyAssignedCount >= maxPerDay) {
      violations.push(createViolation(
        VIOLATION_CODES.INTERVIEWER_DAILY_LIMIT_EXCEEDED,
        `Interviewer "${intName}" has reached their daily limit of ${maxPerDay} interview(s) on ${dateStr} (already assigned ${dailyAssignedCount})`,
        'interviewer',
        intId,
        { maxInterviewsPerDay: maxPerDay, currentCount: dailyAssignedCount, date: dateStr }
      ));
    }
  }

  // 4. Required Technical Skills Check
  const requiredSkills = assignment.requiredSkills || context.requiredSkills;
  if (Array.isArray(requiredSkills) && requiredSkills.length > 0) {
    const combinedInterviewerSkills = new Set();
    for (const interviewer of interviewers) {
      const skills = interviewer.skills || [];
      for (const sk of skills) {
        if (typeof sk === 'string') combinedInterviewerSkills.add(sk.trim().toLowerCase());
      }
    }

    const missingSkills = requiredSkills.filter(req => !combinedInterviewerSkills.has(req.trim().toLowerCase()));
    if (missingSkills.length > 0) {
      violations.push(createViolation(
        VIOLATION_CODES.INTERVIEWER_SKILLS_DEFICIENT,
        `Assigned interviewer panel does not cover required skills: ${missingSkills.join(', ')}`,
        'interviewer',
        interviewers.map(i => i.id).join(','),
        { requiredSkills, missingSkills }
      ));
    }
  }

  return violations;
}

/**
 * Constraint: Validates room availability, maintenance status, double-bookings, capacity, and equipment.
 */
export function validateRoomConstraints(assignment, context) {
  const violations = [];
  const roomId = assignment.roomId || assignment.room_id;
  if (!roomId) return violations;

  const dateStr = normalizeDateStr(assignment.date);
  const targetInterval = extractMinuteInterval(assignment);
  if (!targetInterval || !dateStr) return violations;

  const room = resolveRoom(assignment, context);
  const roomName = room?.name || assignment.roomName || roomId;

  // 1. Room Status (e.g. Maintenance)
  if (room && room.status) {
    const st = room.status.toLowerCase();
    if (st === 'maintenance' || st === 'unavailable') {
      violations.push(createViolation(
        VIOLATION_CODES.ROOM_STATUS_UNAVAILABLE,
        `Room "${roomName}" (${roomId}) cannot be booked because it is under "${room.status}"${room.currentStatusNote ? ` (${room.currentStatusNote})` : ''}`,
        'room',
        roomId,
        { status: room.status, note: room.currentStatusNote }
      ));
    }
  }

  // 2. Room Double-Booking Check (Half-open intervals; adjacent intervals do NOT conflict)
  const existingList = context.existingInterviews || [];
  for (const existing of existingList) {
    if (existing.id && assignment.id && existing.id === assignment.id) continue;
    if (existing.status && existing.status.toLowerCase() === 'cancelled') continue;

    const exRoomId = existing.roomId || existing.room_id;
    if (exRoomId !== roomId) continue;

    const exDate = normalizeDateStr(existing.date);
    if (exDate !== dateStr) continue;

    const exInterval = extractMinuteInterval(existing);
    if (!exInterval) continue;

    if (doIntervalsOverlap(targetInterval, exInterval)) {
      violations.push(createViolation(
        VIOLATION_CODES.ROOM_DOUBLE_BOOKED,
        `Room "${roomName}" (${roomId}) is already occupied on ${dateStr} at [${exInterval.startTime}, ${exInterval.endTime}) by booking ${existing.id || 'existing'}`,
        'room',
        roomId,
        {
          date: dateStr,
          conflictingInterviewId: existing.id,
          conflictingTime: `${exInterval.startTime}-${exInterval.endTime}`,
          proposedTime: `${targetInterval.startTime}-${targetInterval.endTime}`
        }
      ));
    }
  }

  if (!room) return violations;

  // 3. Room Capacity Check
  const panelSize = (assignment.interviewerIds || assignment.interviewer_ids || []).length || 1;
  const requiredCapacity = assignment.requiredCapacity !== undefined
    ? assignment.requiredCapacity
    : (panelSize + 1); // Candidate + Panel

  if (typeof room.capacity === 'number' && room.capacity < requiredCapacity) {
    violations.push(createViolation(
      VIOLATION_CODES.ROOM_CAPACITY_EXCEEDED,
      `Room "${roomName}" capacity of ${room.capacity} is insufficient for required capacity of ${requiredCapacity} (panel: ${panelSize}, candidate: 1)`,
      'room',
      roomId,
      { roomCapacity: room.capacity, requiredCapacity }
    ));
  }

  // 4. Room Type Check
  const requiredType = assignment.requiredRoomType || context.requiredRoomType;
  if (requiredType && room.type) {
    if (room.type.trim().toLowerCase() !== requiredType.trim().toLowerCase()) {
      violations.push(createViolation(
        VIOLATION_CODES.ROOM_TYPE_MISMATCH,
        `Room "${roomName}" has type "${room.type}", but required type is "${requiredType}"`,
        'room',
        roomId,
        { actualType: room.type, requiredType }
      ));
    }
  }

  // 5. Room Equipment Requirements Check
  const requiredEquipment = assignment.requiredEquipment || context.requiredEquipment;
  if (Array.isArray(requiredEquipment) && requiredEquipment.length > 0) {
    const roomEqSet = new Set((room.equipment || []).map(e => e.trim().toLowerCase()));
    const missingEquipment = requiredEquipment.filter(eq => !roomEqSet.has(eq.trim().toLowerCase()));
    if (missingEquipment.length > 0) {
      violations.push(createViolation(
        VIOLATION_CODES.ROOM_EQUIPMENT_MISSING,
        `Room "${roomName}" is missing required equipment: ${missingEquipment.join(', ')}`,
        'room',
        roomId,
        { requiredEquipment, missingEquipment, availableEquipment: room.equipment }
      ));
    }
  }

  return violations;
}

/**
 * Constraint: Validates panel size or composition if specified.
 */
export function validatePanelComposition(assignment, context) {
  const violations = [];
  const requiredPanelSize = assignment.panelSize || assignment.requiredPanelSize || context.panelSize;
  if (typeof requiredPanelSize === 'number' && requiredPanelSize > 0) {
    const interviewers = assignment.interviewerIds || assignment.interviewer_ids || assignment.interviewers || [];
    if (interviewers.length < requiredPanelSize) {
      violations.push(createViolation(
        VIOLATION_CODES.PANEL_SIZE_DEFICIENT,
        `Interview round requires a panel of at least ${requiredPanelSize} interviewer(s), but only ${interviewers.length} assigned`,
        'panel',
        null,
        { actualPanelSize: interviewers.length, requiredPanelSize }
      ));
    }
  }
  return violations;
}

/**
 * Constraint: Protects existing confirmed or locked bookings from collision.
 */
export function validateLockedBookingProtection(assignment, context) {
  const violations = [];
  const dateStr = normalizeDateStr(assignment.date);
  const targetInterval = extractMinuteInterval(assignment);
  if (!targetInterval || !dateStr) return violations;

  const candidateId = assignment.candidateId || assignment.candidate_id;
  const rawInterviewers = assignment.interviewerIds || assignment.interviewer_ids || (assignment.interviewerId ? [assignment.interviewerId] : []);
  const roomId = assignment.roomId || assignment.room_id;

  const existingList = context.existingInterviews || [];
  for (const existing of existingList) {
    if (existing.id && assignment.id && existing.id === assignment.id) continue;
    
    // Check if the existing booking is locked/confirmed
    const isLocked = existing.isLocked === true || existing.is_locked === true || existing.status === 'Confirmed';
    if (!isLocked) continue;

    const exDate = normalizeDateStr(existing.date);
    if (exDate !== dateStr) continue;

    const exInterval = extractMinuteInterval(existing);
    if (!exInterval || !doIntervalsOverlap(targetInterval, exInterval)) continue;

    // Determine what resource collides with the locked booking
    const conflicts = [];
    if (candidateId && (existing.candidateId === candidateId || existing.candidate_id === candidateId)) {
      conflicts.push(`candidate ${candidateId}`);
    }
    const exIntvIds = existing.interviewerIds || existing.interviewer_ids || [];
    const sharedInterviewers = rawInterviewers.filter(id => exIntvIds.includes(id));
    if (sharedInterviewers.length > 0) {
      conflicts.push(`interviewer(s) ${sharedInterviewers.join(', ')}`);
    }
    if (roomId && (existing.roomId === roomId || existing.room_id === roomId)) {
      conflicts.push(`room ${roomId}`);
    }

    if (conflicts.length > 0) {
      violations.push(createViolation(
        VIOLATION_CODES.BOOKING_LOCKED_CONFLICT,
        `Proposed assignment overlaps with locked/confirmed booking "${existing.id}" on ${dateStr} [${exInterval.startTime}-${exInterval.endTime}) sharing ${conflicts.join(' and ')}. Locked bookings cannot be displaced.`,
        'booking',
        existing.id,
        {
          lockedInterviewId: existing.id,
          date: dateStr,
          conflictingResources: conflicts,
          timeWindow: `${exInterval.startTime}-${exInterval.endTime}`
        }
      ));
    }
  }

  return violations;
}

// =============================================================================
// MAIN COMPOSITE VALIDATOR
// =============================================================================

/**
 * Validates a proposed interview assignment against all hard constraints.
 * 
 * Returns all detected violations (does not stop after the first error).
 * 
 * @param {Object} assignment - Proposed assignment object
 * @param {Object} [context={}] - Environment context (existing interviews, resource pools, operating hours, timezone)
 * @returns {{
 *   valid: boolean,
 *   violations: Array<Object>,
 *   assignmentId: string|null,
 *   evaluatedConstraintsCount: number
 * }}
 */
export function validateAssignment(assignment, context = {}) {
  if (!assignment || typeof assignment !== 'object') {
    throw new TypeError('validateAssignment: assignment must be a non-null object');
  }

  const violations = [];
  let evaluatedConstraintsCount = 0;

  // 1. Timezone verification
  evaluatedConstraintsCount += 1;
  violations.push(...validateTimezoneConfig(assignment, context));

  // 2. Interval timing, duration, and operating hours
  evaluatedConstraintsCount += 1;
  violations.push(...validateIntervalTiming(assignment, context));

  // 3. Candidate constraints (double-booking, availability windows)
  evaluatedConstraintsCount += 1;
  violations.push(...validateCandidateConstraints(assignment, context));

  // 4. Interviewer constraints (double-booking, status, weekly availability, daily cap, buffer, skills)
  evaluatedConstraintsCount += 1;
  violations.push(...validateInterviewerConstraints(assignment, context));

  // 5. Room constraints (double-booking, status, capacity, type, equipment)
  evaluatedConstraintsCount += 1;
  violations.push(...validateRoomConstraints(assignment, context));

  // 6. Panel composition
  evaluatedConstraintsCount += 1;
  violations.push(...validatePanelComposition(assignment, context));

  // 7. Locked booking protection
  evaluatedConstraintsCount += 1;
  violations.push(...validateLockedBookingProtection(assignment, context));

  return {
    valid: violations.length === 0,
    violations,
    assignmentId: assignment.id || null,
    evaluatedConstraintsCount
  };
}

/**
 * Validates a batch of assignments and returns map/array of validation results.
 * 
 * @param {Array<Object>} assignments 
 * @param {Object} context 
 * @returns {Array<Object>}
 */
export function validateScheduleBatch(assignments, context = {}) {
  if (!Array.isArray(assignments)) {
    throw new TypeError('validateScheduleBatch: assignments must be an array');
  }
  return assignments.map(a => validateAssignment(a, context));
}
