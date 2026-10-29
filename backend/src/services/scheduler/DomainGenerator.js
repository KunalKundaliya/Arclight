/**
 * ArcLight - CSP Domain Generator & Problem Formulator
 * 
 * Responsible for translating recruitment drive parameters, candidates, interviewers,
 * and chambers into mathematically sound CSP Variables with pre-filtered, initial domains.
 * 
 * Architectural Responsibilities:
 * 1. Generates discrete time slots using Stage 2 TimeGridGenerator across drive dates.
 * 2. Formulates a CspVariable for each candidate round.
 * 3. Applies unary hard-constraint pruning upfront (candidate windows, interviewer status,
 *    weekly working hours, technical skills, room capacities, equipment, and existing booking protection).
 * 4. Assembles valid panel combinations (single interviewer or multi-assessor panels).
 * 5. Computes heuristic cost scores (LCV) for each domain value to guide search.
 * 6. Records rich diagnostics / root cause telemetry if any variable is unsatisfiable.
 */

import { CspVariable } from './CspVariable.js';
import { DomainValue } from './DomainValue.js';
import { generateDriveGrid } from './TimeGridGenerator.js';
import {
  getDayOfWeekFromDate,
  normalizeDateStr,
  extractMinuteInterval
} from './ConstraintValidator.js';
import {
  isIntervalWithinWindow,
  doIntervalsOverlap,
  hasBufferViolation
} from './IntervalUtils.js';
import { parseTimeString } from './TimezoneUtils.js';

/**
 * Generates combinations of size k from an array.
 * @template T
 * @param {T[]} array
 * @param {number} k
 * @param {number} [maxCombinations=10]
 * @returns {T[][]}
 */
function getCombinations(array, k, maxCombinations = 10) {
  if (k <= 0 || array.length < k) return [];
  if (k === 1) return array.slice(0, maxCombinations).map(item => [item]);

  const results = [];
  function backtrack(start, current) {
    if (results.length >= maxCombinations) return;
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      backtrack(i + 1, current);
      current.pop();
      if (results.length >= maxCombinations) break;
    }
  }

  backtrack(0, []);
  return results;
}

/**
 * Checks whether a collection of interviewers collectively possess all required skills.
 * @param {Array<Object>} panel
 * @param {string[]} requiredSkills
 * @returns {boolean}
 */
function panelSatisfiesSkills(panel, requiredSkills) {
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) return true;
  const collectiveSkills = new Set(
    panel.flatMap(i => (Array.isArray(i.skills) ? i.skills : [])).map(s => s.trim().toLowerCase())
  );
  return requiredSkills.every(req => collectiveSkills.has(req.trim().toLowerCase()));
}

export class DomainGenerator {
  /**
   * Generates CSP variables with populated initial domains for a recruitment drive.
   * 
   * @param {Object} options
   * @param {Array<Object>} options.candidates - List of candidates to schedule
   * @param {Array<Object>|Object|string} [options.rounds] - Round definitions (or single round)
   * @param {Array<Object>} options.interviewers - Interviewer faculty pool
   * @param {Array<Object>} options.rooms - Room chamber pool
   * @param {Object} [options.driveConfig={}] - Drive timing & grid configuration
   * @param {Array<Object>} [options.existingInterviews=[]] - Existing/confirmed bookings to respect
   * @param {Object} [options.context={}] - Additional context
   * @returns {{
   *   variables: Array<CspVariable>,
   *   grid: Array<Object>,
   *   totalDomainValues: number,
   *   diagnostics: Array<Object>
   * }}
   */
  static generate({
    candidates = [],
    rounds = null,
    interviewers = [],
    rooms = [],
    driveConfig = {},
    existingInterviews = [],
    context = {}
  }) {
    if (!Array.isArray(candidates)) {
      throw new TypeError('DomainGenerator: candidates must be an array');
    }

    // 1. Resolve Drive Grid Configuration
    const startDate = driveConfig.startDate || '2026-11-02';
    const endDate = driveConfig.endDate || driveConfig.startDate || '2026-11-06';
    const operatingStartTime = driveConfig.operatingStartTime || '09:00';
    const operatingEndTime = driveConfig.operatingEndTime || '17:00';
    const durationMinutes = Number(driveConfig.durationMinutes) || 45;
    const stepMinutes = Number(driveConfig.stepMinutes) || durationMinutes;
    const blackoutIntervals = driveConfig.blackoutIntervals || [];
    const timezone = driveConfig.timezone || context.timezone || 'Asia/Kolkata';
    const defaultBufferMinutes = typeof driveConfig.defaultBufferMinutes === 'number'
      ? driveConfig.defaultBufferMinutes
      : (typeof context.defaultBufferMinutes === 'number' ? context.defaultBufferMinutes : 15);

    // Generate Discrete Half-Open Time Grid using TimeGridGenerator options
    const gridResult = generateDriveGrid({
      startDate,
      endDate,
      operatingStartTime,
      operatingEndTime,
      interviewDurationMinutes: durationMinutes,
      slotGranularityMinutes: stepMinutes,
      blackoutIntervals,
      timezone
    });
    const grid = gridResult.slots || [];

    // 2. Resolve Interview Rounds
    let normalizedRounds = [];
    if (Array.isArray(rounds) && rounds.length > 0) {
      normalizedRounds = rounds.map((r, idx) => ({
        roundId: r.roundId || r.id || `r${idx + 1}`,
        roundName: r.roundName || r.name || r.roundTitle || 'Technical Screen',
        durationMinutes: Number(r.durationMinutes) || durationMinutes,
        requiredSkills: Array.isArray(r.requiredSkills) ? r.requiredSkills : (r.skills || []),
        panelSize: Math.max(1, Number(r.panelSize) || 1),
        requiredRoomType: r.requiredRoomType || r.roomType || null,
        requiredEquipment: Array.isArray(r.requiredEquipment) ? r.requiredEquipment : (r.equipment || []),
        priority: Number(r.priority) || (idx + 1)
      }));
    } else if (rounds && typeof rounds === 'object') {
      normalizedRounds = [{
        roundId: rounds.roundId || rounds.id || 'r1',
        roundName: rounds.roundName || rounds.name || 'Technical Screen',
        durationMinutes: Number(rounds.durationMinutes) || durationMinutes,
        requiredSkills: Array.isArray(rounds.requiredSkills) ? rounds.requiredSkills : [],
        panelSize: Math.max(1, Number(rounds.panelSize) || 1),
        requiredRoomType: rounds.requiredRoomType || null,
        requiredEquipment: Array.isArray(rounds.requiredEquipment) ? rounds.requiredEquipment : [],
        priority: Number(rounds.priority) || 1
      }];
    } else {
      normalizedRounds = [{
        roundId: 'r1',
        roundName: typeof rounds === 'string' ? rounds : (driveConfig.roundName || 'Technical Screen'),
        durationMinutes,
        requiredSkills: driveConfig.requiredSkills || [],
        panelSize: Math.max(1, Number(driveConfig.panelSize) || 1),
        requiredRoomType: driveConfig.requiredRoomType || null,
        requiredEquipment: driveConfig.requiredEquipment || [],
        priority: 1
      }];
    }

    // 3. Pre-index Existing Bookings for Fast Collision Checking
    const allExisting = [...(context.existingInterviews || []), ...existingInterviews];
    const candidateBookings = new Map(); // `${candId}_${date}` -> Array<Interval>
    const interviewerBookings = new Map(); // `${intvId}_${date}` -> Array<{ start, end, buffer }>
    const roomBookings = new Map(); // `${roomId}_${date}` -> Array<Interval>
    const interviewerDailyCount = new Map(); // `${intvId}_${date}` -> count

    for (const ex of allExisting) {
      if (ex.status && ex.status.toLowerCase() === 'cancelled') continue;
      const exDate = normalizeDateStr(ex.date);
      const exInterval = extractMinuteInterval(ex);
      if (!exDate || !exInterval) continue;

      // Candidate index
      const cId = ex.candidateId || ex.candidate_id;
      if (cId) {
        const key = `${cId}_${exDate}`;
        if (!candidateBookings.has(key)) candidateBookings.set(key, []);
        candidateBookings.get(key).push(exInterval);
      }

      // Interviewers index
      const rawIntvIds = ex.interviewerIds || ex.interviewer_ids || (ex.interviewerId ? [ex.interviewerId] : []);
      for (const iId of rawIntvIds) {
        const key = `${iId}_${exDate}`;
        if (!interviewerBookings.has(key)) interviewerBookings.set(key, []);
        interviewerBookings.get(key).push({
          start: exInterval.start,
          end: exInterval.end,
          buffer: ex.bufferMinutes !== undefined ? ex.bufferMinutes : defaultBufferMinutes
        });
        interviewerDailyCount.set(key, (interviewerDailyCount.get(key) || 0) + 1);
      }

      // Room index
      const rId = ex.roomId || ex.room_id;
      if (rId) {
        const key = `${rId}_${exDate}`;
        if (!roomBookings.has(key)) roomBookings.set(key, []);
        roomBookings.get(key).push(exInterval);
      }
    }

    const variables = [];
    let totalDomainValues = 0;
    const globalDiagnostics = [];

    // 4. Formulate Variables and Initial Domains
    for (const cand of candidates) {
      for (const round of normalizedRounds) {
        const requiredSkills = [
          ...new Set([
            ...(round.requiredSkills || []),
            ...(Array.isArray(cand.requiredSkills) ? cand.requiredSkills : [])
          ])
        ];

        const variable = new CspVariable({
          id: `var-${cand.id}-${round.roundId}`,
          candidateId: cand.id,
          candidate: cand,
          roundId: round.roundId,
          roundName: round.roundName,
          durationMinutes: round.durationMinutes,
          requiredSkills,
          panelSize: round.panelSize,
          requiredRoomType: round.requiredRoomType,
          requiredEquipment: round.requiredEquipment,
          priority: round.priority
        });

        const domainValues = [];
        let candidateUnavailableSlots = 0;
        let candidateCollisionSlots = 0;
        let noPanelSlots = 0;
        let noRoomSlots = 0;

        // Evaluate all discrete slots in grid
        for (const slot of grid) {
          const sMin = typeof slot.startMinuteOfDay === 'number'
            ? slot.startMinuteOfDay
            : (typeof slot.startMinutes === 'number' ? slot.startMinutes : parseTimeString(slot.startTime).totalMinutes);
          const eMin = typeof slot.endMinuteOfDay === 'number'
            ? slot.endMinuteOfDay
            : (typeof slot.endMinutes === 'number' ? slot.endMinutes : parseTimeString(slot.endTime).totalMinutes);

          const slotInterval = {
            start: sMin,
            end: eMin,
            startMinuteOfDay: sMin,
            endMinuteOfDay: eMin,
            startTime: slot.startTime,
            endTime: slot.endTime
          };

          // A. Candidate Availability Windows check
          if (Array.isArray(cand.availabilityWindows) && cand.availabilityWindows.length > 0) {
            const dayOfWeek = getDayOfWeekFromDate(slot.date);
            const applicableWindows = cand.availabilityWindows.filter(w => {
              if (w.date && normalizeDateStr(w.date) !== slot.date) return false;
              if (w.dayOfWeek && w.dayOfWeek.toLowerCase() !== dayOfWeek.toLowerCase()) return false;
              return true;
            });

            if (applicableWindows.length > 0) {
              const fits = applicableWindows.some(w => {
                const winInterval = extractMinuteInterval(w);
                return winInterval && isIntervalWithinWindow(slotInterval, winInterval);
              });
              if (!fits) {
                candidateUnavailableSlots++;
                continue;
              }
            }
          }

          // B. Candidate collision against existing interviews
          const candBookingsOnDate = candidateBookings.get(`${cand.id}_${slot.date}`) || [];
          const hasCandCollision = candBookingsOnDate.some(ex => doIntervalsOverlap(slotInterval, ex));
          if (hasCandCollision) {
            candidateCollisionSlots++;
            continue;
          }

          // C. Filter eligible interviewers for this slot
          const dayOfWeek = getDayOfWeekFromDate(slot.date);
          const eligibleInterviewers = interviewers.filter(i => {
            // Status check
            if (i.status === 'On Leave' || i.status === 'Inactive') return false;

            // Weekly availability check
            const weekly = i.weeklyAvailability || i.weekly_availability;
            if (weekly && typeof weekly === 'object' && Object.keys(weekly).length > 0) {
              const daySlots = weekly[dayOfWeek];
              if (!Array.isArray(daySlots) || daySlots.length === 0) return false;
              const matchesWeekly = daySlots.some(s => {
                if (typeof s === 'string') return s === slot.startTime;
                if (typeof s === 'object' && s.startTime && s.endTime) {
                  const win = extractMinuteInterval(s);
                  return win && isIntervalWithinWindow(slotInterval, win);
                }
                return false;
              });
              if (!matchesWeekly) return false;
            }

            // Daily interview cap check
            const key = `${i.id}_${slot.date}`;
            const existingCount = interviewerDailyCount.get(key) || 0;
            const maxPerDay = typeof i.maxInterviewsPerDay === 'number' ? i.maxInterviewsPerDay : 4;
            if (existingCount >= maxPerDay) return false;

            // Interviewer collision and buffer check against existing bookings
            const intvBookings = interviewerBookings.get(key) || [];
            const intvBuffer = typeof i.bufferMinutes === 'number' ? i.bufferMinutes : defaultBufferMinutes;

            for (const ex of intvBookings) {
              if (doIntervalsOverlap(slotInterval, ex)) return false;
              if (intvBuffer > 0 && hasBufferViolation(slotInterval, ex, intvBuffer)) return false;
            }

            return true;
          });

          // D. Formulate Interviewer Panel(s)
          let panels = [];
          if (variable.panelSize === 1) {
            const skillQualified = eligibleInterviewers.filter(i =>
              panelSatisfiesSkills([i], variable.requiredSkills)
            );
            panels = skillQualified.map(i => [i]);
          } else {
            // Multi-interviewer panel
            const combos = getCombinations(eligibleInterviewers, variable.panelSize, 12);
            panels = combos.filter(panel => panelSatisfiesSkills(panel, variable.requiredSkills));
          }

          if (panels.length === 0) {
            noPanelSlots++;
            continue;
          }

          // E. Filter eligible rooms for this slot
          const eligibleRooms = rooms.filter(r => {
            if (r.status === 'Maintenance' || r.status === 'Offline') return false;
            const cap = typeof r.capacity === 'number' ? r.capacity : 4;
            if (cap < (variable.panelSize + 1)) return false;

            if (variable.requiredRoomType) {
              const rType = (r.type || '').trim().toLowerCase();
              const reqType = variable.requiredRoomType.trim().toLowerCase();
              if (rType !== reqType) return false;
            }

            if (Array.isArray(variable.requiredEquipment) && variable.requiredEquipment.length > 0) {
              const rEq = new Set((r.equipment || []).map(e => e.trim().toLowerCase()));
              const hasAllEq = variable.requiredEquipment.every(eq => rEq.has(eq.trim().toLowerCase()));
              if (!hasAllEq) return false;
            }

            // Room collision with existing bookings
            const rBookings = roomBookings.get(`${r.id}_${slot.date}`) || [];
            return !rBookings.some(ex => doIntervalsOverlap(slotInterval, ex));
          });

          if (eligibleRooms.length === 0) {
            noRoomSlots++;
            continue;
          }

          // F. Assemble atomic DomainValues
          for (const panel of panels) {
            for (const room of eligibleRooms) {
              // Heuristic cost for LCV:
              // 1. Workload balancing: sum of current bookings for panel interviewers
              const panelWorkload = panel.reduce((sum, i) => {
                const count = interviewerDailyCount.get(`${i.id}_${slot.date}`) || 0;
                return sum + count;
              }, 0);

              // 2. Right-sizing room: minimize wasted capacity
              const wastedCap = ((room.capacity || 4) - (variable.panelSize + 1)) * 0.2;

              // 3. Skill affinity bonus (LCV value ordering)
              let skillAffinityBonus = 0;
              const candSkills = Array.isArray(cand.skills) ? cand.skills : [];
              if (candSkills.length > 0) {
                const panelSkillsSet = new Set();
                for (const interviewer of panel) {
                  (interviewer.skills || []).forEach(s => panelSkillsSet.add(s.trim().toLowerCase()));
                }
                const matchCount = candSkills.filter(s => {
                  const sLower = s.trim().toLowerCase();
                  if (panelSkillsSet.has(sLower)) return true;
                  for (const ps of panelSkillsSet) {
                    if (ps.includes(sLower) || sLower.includes(ps)) return true;
                    if (sLower.includes('system') && ps.includes('system')) return true;
                    if (sLower.includes('distribut') && ps.includes('distribut')) return true;
                    if ((sLower.includes('consensus') || sLower.includes('raft')) && (ps.includes('consensus') || ps.includes('raft'))) return true;
                    if ((sLower.includes('cloud') || sLower.includes('k8s') || sLower.includes('kubernetes')) && (ps.includes('cloud') || ps.includes('kubernetes') || ps.includes('terraform') || ps.includes('linux'))) return true;
                  }
                  return false;
                }).length;
                skillAffinityBonus = Math.min(2, matchCount) * 4;
              }

              // 4. Drive day spread heuristic to balance load across recruitment week
              const candIdx = candidates.findIndex(c => c.id === cand.id);
              const uniqueDates = [...new Set(grid.map(g => g.date))];
              let dayBalanceAdjustment = 0;
              if (uniqueDates.length > 1 && candIdx >= 0) {
                const preferredDayIdx = candIdx % uniqueDates.length;
                const slotDayIdx = uniqueDates.indexOf(slot.date);
                if (slotDayIdx === preferredDayIdx) {
                  dayBalanceAdjustment = -5;
                }
              }

              const cost = panelWorkload + wastedCap - skillAffinityBonus + dayBalanceAdjustment;

              const domainValue = new DomainValue({
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                startMinutes: sMin,
                endMinutes: eMin,
                interviewerIds: panel.map(i => i.id),
                interviewers: panel,
                roomId: room.id,
                room,
                slot,
                cost
              });

              domainValues.push(domainValue);
            }
          }
        }

        // Set the active domain on the variable
        variable.setInitialDomain(domainValues);
        totalDomainValues += domainValues.length;

        // Record diagnostics if domain is empty
        if (domainValues.length === 0) {
          const diag = {
            variableId: variable.id,
            candidateId: cand.id,
            candidateName: cand.name,
            roundName: round.roundName,
            totalSlotsEvaluated: grid.length,
            candidateUnavailableSlots,
            candidateCollisionSlots,
            noPanelSlots,
            noRoomSlots,
            requiredSkills: variable.requiredSkills,
            panelSize: variable.panelSize,
            reason: 'Zero valid domain values found satisfying all unary hard constraints'
          };
          variable.diagnostics.push(diag);
          globalDiagnostics.push(diag);
        }

        variables.push(variable);
      }
    }

    return {
      variables,
      grid,
      totalDomainValues,
      diagnostics: globalDiagnostics
    };
  }
}
