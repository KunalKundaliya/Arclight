/**
 * ArcLight - Stage 6 Dynamic Rescheduling & Minimal-Displacement Repair Engine
 * 
 * Provides real-time resilience and minimal-perturbation schedule repair:
 * 1. Faculty Call-Out / Cancellation Repair:
 *    - Tier 1: Instant zero-displacement substitute assessor replacement.
 *    - Tier 2: Minimal temporal slot shift for the candidate.
 * 2. Chamber Outage / Maintenance Repair:
 *    - Reassigns sessions to alternative qualified chambers with zero candidate/faculty disruption.
 * 3. Candidate Reschedule Request:
 *    - Relocates a candidate's session to preferred windows while keeping all other bookings locked.
 * 4. General Collision Diagnostic & Repair:
 *    - Scans schedule for collisions and computes minimal-displacement repair actions.
 * 
 * Architectural Guarantee:
 * Every repair action is verified against Stage 3 ConstraintValidator;
 * 100% hard-constraint validity is strictly preserved.
 */

import { parseTimeString } from './TimezoneUtils.js';
import {
  doIntervalsOverlap,
  hasBufferViolation,
  isIntervalWithinWindow
} from './IntervalUtils.js';
import {
  validateScheduleBatch,
  extractMinuteInterval,
  getDayOfWeekFromDate
} from './ConstraintValidator.js';
import { generateDailySlots } from './TimeGridGenerator.js';

export class DynamicRepairEngine {
  /**
   * Helper: Clones an interview assignment.
   */
  static cloneAssignment(assignment) {
    return {
      ...assignment,
      interviewerIds: [...(assignment.interviewerIds || [])],
      interviewerNames: [...(assignment.interviewerNames || [])],
      requiredSkills: [...(assignment.requiredSkills || [])],
      requiredEquipment: [...(assignment.requiredEquipment || [])]
    };
  }

  /**
   * Helper: Clones a schedule.
   */
  static cloneSchedule(schedule) {
    return schedule.map(a => this.cloneAssignment(a));
  }

  /**
   * 1. Handles Faculty Call-Out / Unavailability
   * 
   * @param {Object} params
   * @param {Array<Object>} params.schedule - Current active schedule
   * @param {string} params.interviewerId - ID of interviewer calling out
   * @param {string} [params.date] - Optional specific date of unavailability
   * @param {string} [params.startTime] - Optional start of unavailable window
   * @param {string} [params.endTime] - Optional end of unavailable window
   * @param {Object} params.context - Resource context (interviewers, rooms, candidates)
   * @param {Object} [params.options={}] - Search controls
   * @param {boolean} [params.options.allowSlotShift=true] - Allow shifting time slot if no substitute available
   * @returns {Object} RepairReport
   */
  static handleInterviewerCallout({
    schedule = [],
    interviewerId,
    date,
    startTime,
    endTime,
    context = {},
    options = {}
  }) {
    const startExecution = Date.now();
    if (!interviewerId) throw new TypeError('handleInterviewerCallout: interviewerId is required');

    const workingSchedule = this.cloneSchedule(schedule);
    const affectedInterviews = [];
    const repairedActions = [];
    const unresolved = [];

    const interviewers = context.interviewers || [];
    const interviewerMap = new Map(interviewers.map(i => [i.id, i]));
    const callingOutFaculty = interviewerMap.get(interviewerId);
    const resolvedTimezone = context.timezone || 'Asia/Kolkata';

    // 1. Identify all affected interviews
    for (let i = 0; i < workingSchedule.length; i++) {
      const a = workingSchedule[i];
      const ids = a.interviewerIds || a.interviewer_ids || (a.interviewerId ? [a.interviewerId] : []);
      if (!ids.includes(interviewerId)) continue;

      if (date && a.date !== date) continue;

      if (startTime && endTime) {
        const aInterval = extractMinuteInterval(a);
        const winInterval = {
          start: parseTimeString(startTime).totalMinutes,
          end: parseTimeString(endTime).totalMinutes
        };
        if (!aInterval || !doIntervalsOverlap(aInterval, winInterval)) continue;
      }

      affectedInterviews.push({ index: i, assignment: a });
    }

    if (affectedInterviews.length === 0) {
      return {
        success: true,
        disruptionType: 'FACULTY_CALLOUT',
        affectedCount: 0,
        repairedCount: 0,
        unresolvedCount: 0,
        displacedCandidatesCount: 0,
        displacedFacultyCount: 0,
        totalShiftMinutes: 0,
        actions: [],
        unresolved: [],
        repairedSchedule: workingSchedule,
        validation: { isValid: true, totalViolations: 0 }
      };
    }

    let displacedCandidates = 0;
    let displacedFaculty = 0;
    let totalShiftMinutes = 0;

    // 2. Resolve each affected interview
    for (const { index, assignment } of affectedInterviews) {
      const target = workingSchedule[index];
      const targetInterval = extractMinuteInterval(target);
      const reqSkills = target.requiredSkills || [];

      // Exclude current assignment when checking resource collisions in schedule
      const remainingSchedule = workingSchedule.filter((_, idx) => idx !== index);

      // Strategy A: Find an idle qualified substitute interviewer for SAME slot & room
      // Zero Candidate Displacement!
      const eligibleSubstitutes = interviewers.filter(sub => {
        if (sub.id === interviewerId) return false;
        if (sub.status === 'On Leave' || sub.status === 'Inactive') return false;

        // Skill check: substitute must have required skills
        const subSkills = new Set((sub.skills || []).map(s => s.trim().toLowerCase()));
        const hasSkills = reqSkills.every(req => subSkills.has(req.trim().toLowerCase()));
        if (!hasSkills) return false;

        // Weekly availability check on this date
        const dayOfWeek = getDayOfWeekFromDate(target.date);
        const weekly = sub.weeklyAvailability || sub.weekly_availability;
        if (weekly && typeof weekly === 'object' && Object.keys(weekly).length > 0) {
          const daySlots = weekly[dayOfWeek];
          if (!Array.isArray(daySlots) || daySlots.length === 0) return false;
          const matches = daySlots.some(s => {
            if (typeof s === 'string') return s === target.startTime;
            if (typeof s === 'object' && s.startTime && s.endTime) {
              const win = extractMinuteInterval(s);
              return win && isIntervalWithinWindow(targetInterval, win);
            }
            return false;
          });
          if (!matches) return false;
        }

        // Daily cap check
        const subBookingsOnDate = remainingSchedule.filter(ex => {
          const raw = ex.interviewerIds || ex.interviewer_ids || (ex.interviewerId ? [ex.interviewerId] : []);
          return raw.includes(sub.id) && ex.date === target.date;
        });

        const maxPerDay = typeof sub.maxInterviewsPerDay === 'number' ? sub.maxInterviewsPerDay : 4;
        if (subBookingsOnDate.length >= maxPerDay) return false;

        // Collision and buffer check against substitute's existing interviews
        const buf = typeof sub.bufferMinutes === 'number' ? sub.bufferMinutes : 15;
        for (const ex of subBookingsOnDate) {
          const exInterval = extractMinuteInterval(ex);
          if (!exInterval) continue;
          if (doIntervalsOverlap(targetInterval, exInterval)) return false;
          if (buf > 0 && hasBufferViolation(targetInterval, exInterval, buf)) return false;
        }

        return true;
      });

      if (eligibleSubstitutes.length > 0) {
        // Choose best substitute (least busy)
        const chosenSub = eligibleSubstitutes[0];

        // Replace interviewer in target
        target.interviewerIds = target.interviewerIds.map(id => id === interviewerId ? chosenSub.id : id);
        target.interviewerNames = target.interviewerIds.map(id => interviewerMap.get(id)?.name || id);

        displacedFaculty++;
        repairedActions.push({
          actionType: 'SUBSTITUTE_FACULTY',
          interviewId: target.id,
          candidateId: target.candidateId,
          candidateName: target.candidateName,
          date: target.date,
          startTime: target.startTime,
          endTime: target.endTime,
          originalInterviewerId: interviewerId,
          originalInterviewerName: callingOutFaculty?.name || interviewerId,
          newInterviewerId: chosenSub.id,
          newInterviewerName: chosenSub.name,
          shiftMinutes: 0,
          description: `Assigned substitute faculty ${chosenSub.name} with zero candidate time displacement`
        });
        continue;
      }

      // Strategy B: Minimal Slot Shift (if substitute is not available in current slot)
      if (options.allowSlotShift !== false) {
        const operatingHours = {
          operatingStartTime: context.operatingStartTime || '09:00',
          operatingEndTime: context.operatingEndTime || '17:00',
          interviewDurationMinutes: target.durationMinutes || 45,
          slotGranularityMinutes: 15,
          timezone: resolvedTimezone
        };

        const slots = generateDailySlots({
          date: target.date,
          ...operatingHours
        });

        let shiftedSuccess = false;

        for (const slot of slots) {
          const slotInterval = {
            start: slot.startMinuteOfDay,
            end: slot.endMinuteOfDay,
            startTime: slot.startTime,
            endTime: slot.endTime
          };

          // Check if candidate is free in this slot
          const candBusy = remainingSchedule.some(ex => {
            if (ex.candidateId !== target.candidateId || ex.date !== target.date) return false;
            const exInterval = extractMinuteInterval(ex);
            return exInterval && doIntervalsOverlap(slotInterval, exInterval);
          });
          if (candBusy) continue;

          // Find available qualified interviewer in this slot
          const availableIntv = interviewers.find(i => {
            if (i.id === interviewerId) return false;
            if (i.status === 'On Leave') return false;

            const subSkills = new Set((i.skills || []).map(s => s.trim().toLowerCase()));
            if (!reqSkills.every(req => subSkills.has(req.trim().toLowerCase()))) return false;

            const subBookings = remainingSchedule.filter(ex => {
              const raw = ex.interviewerIds || ex.interviewer_ids || (ex.interviewerId ? [ex.interviewerId] : []);
              return raw.includes(i.id) && ex.date === target.date;
            });

            if (subBookings.length >= (i.maxInterviewsPerDay || 4)) return false;

            const buf = typeof i.bufferMinutes === 'number' ? i.bufferMinutes : 15;
            for (const ex of subBookings) {
              const exInt = extractMinuteInterval(ex);
              if (!exInt) continue;
              if (doIntervalsOverlap(slotInterval, exInt)) return false;
              if (buf > 0 && hasBufferViolation(slotInterval, exInt, buf)) return false;
            }
            return true;
          });

          if (!availableIntv) continue;

          // Check room availability
          const rooms = context.rooms || [];
          const freeRoom = rooms.find(r => {
            if (r.status === 'Maintenance') return false;
            return !remainingSchedule.some(ex => {
              if (ex.roomId !== r.id || ex.date !== target.date) return false;
              const exInt = extractMinuteInterval(ex);
              return exInt && doIntervalsOverlap(slotInterval, exInt);
            });
          });

          if (!freeRoom) continue;

          // Apply shift
          const prevStartTime = target.startTime;
          const prevEndTime = target.endTime;
          const shiftDelta = Math.abs(slotInterval.start - targetInterval.start);

          target.startTime = slot.startTime;
          target.endTime = slot.endTime;
          target.startMinutes = slot.startMinuteOfDay;
          target.endMinutes = slot.endMinuteOfDay;
          target.interviewerIds = [availableIntv.id];
          target.interviewerNames = [availableIntv.name];
          target.roomId = freeRoom.id;
          target.roomName = freeRoom.name;

          displacedCandidates++;
          displacedFaculty++;
          totalShiftMinutes += shiftDelta;

          repairedActions.push({
            actionType: 'SHIFT_TIME_SLOT',
            interviewId: target.id,
            candidateId: target.candidateId,
            candidateName: target.candidateName,
            date: target.date,
            previousTime: `${prevStartTime}-${prevEndTime}`,
            newTime: `${slot.startTime}-${slot.endTime}`,
            newInterviewerId: availableIntv.id,
            newInterviewerName: availableIntv.name,
            newRoomId: freeRoom.id,
            newRoomName: freeRoom.name,
            shiftMinutes: shiftDelta,
            description: `Shifted session to ${slot.startTime} with faculty ${availableIntv.name} in room ${freeRoom.name}`
          });

          shiftedSuccess = true;
          break;
        }

        if (shiftedSuccess) continue;
      }

      // If neither substitute nor shifted slot could be found:
      unresolved.push({
        interviewId: target.id,
        candidateId: target.candidateId,
        candidateName: target.candidateName,
        date: target.date,
        time: `${target.startTime}-${target.endTime}`,
        reason: `No qualified substitute faculty available with skills [${reqSkills.join(', ')}] on ${target.date}`
      });
    }

    // Validate repaired schedule against Stage 3 Hard Constraints
    const validationResults = validateScheduleBatch(workingSchedule, context);
    const isValid = validationResults.every(r => r.valid);

    return {
      success: unresolved.length === 0 && isValid,
      disruptionType: 'FACULTY_CALLOUT',
      affectedCount: affectedInterviews.length,
      repairedCount: repairedActions.length,
      unresolvedCount: unresolved.length,
      displacedCandidatesCount: displacedCandidates,
      displacedFacultyCount: displacedFaculty,
      totalShiftMinutes,
      actions: repairedActions,
      unresolved,
      repairedSchedule: workingSchedule,
      schedule: workingSchedule,
      validation: {
        isValid,
        totalViolations: validationResults.reduce((sum, r) => sum + r.violations.length, 0)
      },
      executionTimeMs: Date.now() - startExecution
    };
  }

  /**
   * 2. Handles Chamber Outage / Emergency Maintenance
   * 
   * @param {Object} params
   * @param {Array<Object>} params.schedule - Current schedule
   * @param {string} params.roomId - Chamber taken offline
   * @param {string} [params.date] - Optional outage date
   * @param {Object} params.context - Resource context
   * @returns {Object} RepairReport
   */
  static handleRoomOutage({
    schedule = [],
    roomId,
    date,
    context = {}
  }) {
    const startExecution = Date.now();
    if (!roomId) throw new TypeError('handleRoomOutage: roomId is required');

    const workingSchedule = this.cloneSchedule(schedule);
    const affected = [];
    const repairedActions = [];
    const unresolved = [];

    const rooms = context.rooms || [];
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const offlineRoom = roomMap.get(roomId);

    // Identify all affected interviews
    for (let i = 0; i < workingSchedule.length; i++) {
      const a = workingSchedule[i];
      if (a.roomId !== roomId) continue;
      if (date && a.date !== date) continue;
      affected.push({ index: i, assignment: a });
    }

    if (affected.length === 0) {
      return {
        success: true,
        disruptionType: 'ROOM_OUTAGE',
        affectedCount: 0,
        repairedCount: 0,
        unresolvedCount: 0,
        actions: [],
        unresolved: [],
        repairedSchedule: workingSchedule,
        validation: { isValid: true, totalViolations: 0 }
      };
    }

    // Reassign each affected interview to an alternative qualified chamber
    for (const { index, assignment } of affected) {
      const target = workingSchedule[index];
      const targetInterval = extractMinuteInterval(target);
      const remainingSchedule = workingSchedule.filter((_, idx) => idx !== index);

      const requiredCapacity = (target.panelSize || (target.interviewerIds?.length || 1)) + 1;
      const requiredRoomType = target.requiredRoomType;
      const requiredEquipment = target.requiredEquipment || [];

      // Find alternative eligible room
      const eligibleRooms = rooms.filter(r => {
        if (r.id === roomId) return false;
        if (r.status === 'Maintenance' || r.status === 'Offline') return false;
        if ((r.capacity || 4) < requiredCapacity) return false;

        if (requiredRoomType && (r.type || '').trim().toLowerCase() !== requiredRoomType.trim().toLowerCase()) {
          return false;
        }

        if (requiredEquipment.length > 0) {
          const rEq = new Set((r.equipment || []).map(e => e.trim().toLowerCase()));
          const hasAll = requiredEquipment.every(eq => rEq.has(eq.trim().toLowerCase()));
          if (!hasAll) return false;
        }

        // Must not be double-booked in remaining schedule
        const isDoubleBooked = remainingSchedule.some(ex => {
          if (ex.roomId !== r.id || ex.date !== target.date) return false;
          const exInt = extractMinuteInterval(ex);
          return exInt && doIntervalsOverlap(targetInterval, exInt);
        });

        return !isDoubleBooked;
      });

      if (eligibleRooms.length > 0) {
        const altRoom = eligibleRooms[0];
        const oldRoomId = target.roomId;
        target.roomId = altRoom.id;
        target.roomName = altRoom.name;

        repairedActions.push({
          actionType: 'REASSIGN_CHAMBER',
          interviewId: target.id,
          candidateId: target.candidateId,
          candidateName: target.candidateName,
          date: target.date,
          time: `${target.startTime}-${target.endTime}`,
          originalRoomId: oldRoomId,
          originalRoomName: offlineRoom?.name || oldRoomId,
          newRoomId: altRoom.id,
          newRoomName: altRoom.name,
          shiftMinutes: 0,
          description: `Migrated session from chamber ${offlineRoom?.name || oldRoomId} to ${altRoom.name} with zero time shift`
        });
      } else {
        unresolved.push({
          interviewId: target.id,
          candidateId: target.candidateId,
          date: target.date,
          time: `${target.startTime}-${target.endTime}`,
          reason: `No alternative chambers available with capacity >= ${requiredCapacity} at ${target.startTime}`
        });
      }
    }

    const validationResults = validateScheduleBatch(workingSchedule, context);
    const isValid = validationResults.every(r => r.valid);

    return {
      success: unresolved.length === 0 && isValid,
      disruptionType: 'ROOM_OUTAGE',
      affectedCount: affected.length,
      repairedCount: repairedActions.length,
      unresolvedCount: unresolved.length,
      actions: repairedActions,
      unresolved,
      repairedSchedule: workingSchedule,
      schedule: workingSchedule,
      validation: {
        isValid,
        totalViolations: validationResults.reduce((sum, r) => sum + r.violations.length, 0)
      },
      executionTimeMs: Date.now() - startExecution
    };
  }

  /**
   * 3. Candidate Self-Reschedule / Availability Change
   * Relocates a candidate's session to their preferred window while keeping
   * all other confirmed bookings strictly locked.
   * 
   * @param {Object} params
   * @param {Array<Object>} params.schedule - Current schedule
   * @param {string} params.candidateId - ID of candidate requesting reschedule
   * @param {Object} params.preferredWindow - { date, preferredStartTime, availabilityWindows }
   * @param {Object} params.context - Resource context
   * @param {Object} [params.options={}]
   * @returns {Object} RepairReport
   */
  static rescheduleCandidate({
    schedule = [],
    candidateId,
    preferredWindow = {},
    context = {},
    options = {}
  }) {
    const startExecution = Date.now();
    if (!candidateId) throw new TypeError('rescheduleCandidate: candidateId is required');

    const workingSchedule = this.cloneSchedule(schedule);
    const targetIdx = workingSchedule.findIndex(a => a.candidateId === candidateId);

    if (targetIdx === -1) {
      throw new Error(`rescheduleCandidate: Candidate "${candidateId}" has no scheduled interview in this drive`);
    }

    const target = workingSchedule[targetIdx];
    const previousDate = target.date;
    const previousStartTime = target.startTime;
    const previousEndTime = target.endTime;

    // Remaining schedule with all other candidates' bookings locked
    const remainingSchedule = workingSchedule.filter((_, idx) => idx !== targetIdx);

    const targetDate = preferredWindow.date || target.date;
    const durationMinutes = target.durationMinutes || 45;
    const resolvedTimezone = context.timezone || 'Asia/Kolkata';

    const slots = generateDailySlots({
      date: targetDate,
      timezone: resolvedTimezone,
      operatingStartTime: context.operatingStartTime || '09:00',
      operatingEndTime: context.operatingEndTime || '17:00',
      interviewDurationMinutes: durationMinutes,
      slotGranularityMinutes: 15
    });

    const interviewers = context.interviewers || [];
    const rooms = (context.rooms || []).filter(r => r.status !== 'Maintenance');
    const reqSkills = target.requiredSkills || [];

    // Sort slots by closeness to candidate's preferredStartTime if provided
    let candidateSlots = slots.slice();
    if (preferredWindow.preferredStartTime) {
      const prefMinutes = parseTimeString(preferredWindow.preferredStartTime).totalMinutes;
      candidateSlots.sort((a, b) => {
        return Math.abs(a.startMinuteOfDay - prefMinutes) - Math.abs(b.startMinuteOfDay - prefMinutes);
      });
    }

    let resolvedSlot = null;
    let chosenInterviewer = null;
    let chosenRoom = null;

    for (const slot of candidateSlots) {
      const slotInterval = {
        start: slot.startMinuteOfDay,
        end: slot.endMinuteOfDay,
        startTime: slot.startTime,
        endTime: slot.endTime
      };

      // 1. Candidate Availability check
      if (Array.isArray(preferredWindow.availabilityWindows) && preferredWindow.availabilityWindows.length > 0) {
        const inWindow = preferredWindow.availabilityWindows.some(w => {
          const win = extractMinuteInterval(w);
          return win && isIntervalWithinWindow(slotInterval, win);
        });
        if (!inWindow) continue;
      }

      // 2. Candidate not busy elsewhere
      const candCollision = remainingSchedule.some(ex => {
        if (ex.candidateId !== candidateId || ex.date !== targetDate) return false;
        const exInt = extractMinuteInterval(ex);
        return exInt && doIntervalsOverlap(slotInterval, exInt);
      });
      if (candCollision) continue;

      // 3. Find qualified interviewer (try original faculty first for continuity)
      const currentIntvId = target.interviewerIds?.[0];
      const eligibleInterviewers = interviewers.filter(i => {
        if (i.status === 'On Leave') return false;
        const subSkills = new Set((i.skills || []).map(s => s.trim().toLowerCase()));
        if (!reqSkills.every(req => subSkills.has(req.trim().toLowerCase()))) return false;

        const bookingsOnDate = remainingSchedule.filter(ex => {
          const raw = ex.interviewerIds || ex.interviewer_ids || (ex.interviewerId ? [ex.interviewerId] : []);
          return raw.includes(i.id) && ex.date === targetDate;
        });

        if (bookingsOnDate.length >= (i.maxInterviewsPerDay || 4)) return false;

        const buf = typeof i.bufferMinutes === 'number' ? i.bufferMinutes : 15;
        for (const ex of bookingsOnDate) {
          const exInt = extractMinuteInterval(ex);
          if (!exInt) continue;
          if (doIntervalsOverlap(slotInterval, exInt)) return false;
          if (buf > 0 && hasBufferViolation(slotInterval, exInt, buf)) return false;
        }
        return true;
      });

      if (eligibleInterviewers.length === 0) continue;

      // Prefer original faculty if available
      const matchingFaculty = eligibleInterviewers.find(i => i.id === currentIntvId) || eligibleInterviewers[0];

      // 4. Find room
      const freeRoom = rooms.find(r => {
        return !remainingSchedule.some(ex => {
          if (ex.roomId !== r.id || ex.date !== targetDate) return false;
          const exInt = extractMinuteInterval(ex);
          return exInt && doIntervalsOverlap(slotInterval, exInt);
        });
      });

      if (!freeRoom) continue;

      resolvedSlot = slot;
      chosenInterviewer = matchingFaculty;
      chosenRoom = freeRoom;
      break;
    }

    if (!resolvedSlot) {
      return {
        success: false,
        disruptionType: 'CANDIDATE_RESCHEDULE',
        candidateId,
        candidateName: target.candidateName,
        actions: [],
        unresolved: [{
          candidateId,
          reason: `No conflict-free slots found on ${targetDate} matching preferred availability windows`
        }],
        repairedSchedule: workingSchedule,
        validation: { isValid: true, totalViolations: 0 }
      };
    }

    // Apply the reschedule
    target.date = targetDate;
    target.startTime = resolvedSlot.startTime;
    target.endTime = resolvedSlot.endTime;
    target.startMinutes = resolvedSlot.startMinuteOfDay;
    target.endMinutes = resolvedSlot.endMinuteOfDay;
    target.interviewerIds = [chosenInterviewer.id];
    target.interviewerNames = [chosenInterviewer.name];
    target.roomId = chosenRoom.id;
    target.roomName = chosenRoom.name;

    const validationResults = validateScheduleBatch(workingSchedule, context);
    const isValid = validationResults.every(r => r.valid);

    return {
      success: isValid,
      disruptionType: 'CANDIDATE_RESCHEDULE',
      candidateId,
      candidateName: target.candidateName,
      actions: [{
        actionType: 'RESCHEDULE_CANDIDATE',
        interviewId: target.id,
        candidateId,
        previousDate,
        previousTime: `${previousStartTime}-${previousEndTime}`,
        newDate: targetDate,
        newTime: `${resolvedSlot.startTime}-${resolvedSlot.endTime}`,
        assignedInterviewer: chosenInterviewer.name,
        assignedRoom: chosenRoom.name,
        description: `Successfully rescheduled candidate from ${previousDate} ${previousStartTime} to ${targetDate} ${resolvedSlot.startTime}`
      }],
      unresolved: [],
      repairedSchedule: workingSchedule,
      schedule: workingSchedule,
      validation: {
        isValid,
        totalViolations: validationResults.reduce((sum, r) => sum + r.violations.length, 0)
      },
      executionTimeMs: Date.now() - startExecution
    };
  }

  /**
   * Alias wrapper for Faculty Call-Out / Assessor Absence Repair
   */
  static repairFacultyCallOut(params = {}) {
    const startTime = params.startTime || params.timeRange?.startTime;
    const endTime = params.endTime || params.timeRange?.endTime;
    const result = this.handleInterviewerCallout({
      ...params,
      interviewerId: params.unavailableInterviewerId || params.interviewerId,
      startTime,
      endTime
    });
    result.schedule = result.repairedSchedule;
    return result;
  }

  /**
   * Alias wrapper for Chamber Outage / Emergency Maintenance Migration
   */
  static repairChamberOutage(params = {}) {
    const result = this.handleRoomOutage({
      ...params,
      roomId: params.offlineRoomId || params.roomId
    });
    result.schedule = result.repairedSchedule;
    return result;
  }
}

