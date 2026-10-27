/**
 * ArcLight - Deterministic CSP Backtracking Solver
 * 
 * Implements a complete Constraint Satisfaction Problem (CSP) solver:
 * - Minimum Remaining Values (MRV) variable selection heuristic
 * - Degree heuristic tie-breaking
 * - Least Constraining Value (LCV) heuristic value ordering
 * - Forward Checking (FC) with immediate domain wipeout detection
 * - Chronological backtracking with reversible pruning stack
 * - Interviewer daily cap and buffer constraint enforcement
 * - Resilient partial schedule recovery on over-constrained instances
 * - Rich diagnostic telemetry and solve time metrics
 */

import { DomainGenerator } from './DomainGenerator.js';
import {
  doIntervalsOverlap,
  hasBufferViolation
} from './IntervalUtils.js';
import { validateScheduleBatch } from './ConstraintValidator.js';

export class CspSolver {
  /**
   * Solves the CSP problem for a given set of pre-initialized CspVariables.
   * 
   * @param {Object} params
   * @param {Array<import('./CspVariable.js').CspVariable>} params.variables
   * @param {Object} [params.context={}] - Context with existing interviews, interviewer pools, etc.
   * @param {Object} [params.options={}] - Search controls and heuristic configurations
   * @param {string} [params.options.variableHeuristic='MRV'] - 'MRV' | 'DEGREE' | 'NATURAL'
   * @param {string} [params.options.valueHeuristic='LCV'] - 'LCV' | 'NATURAL'
   * @param {boolean} [params.options.enableForwardChecking=true] - Enable forward checking
   * @param {number} [params.options.maxBacktracks=10000] - Backtrack ceiling
   * @param {number} [params.options.timeoutMs=10000] - Timeout limit in milliseconds
   * @param {boolean} [params.options.allowPartial=true] - Return maximal partial schedule if complete solution impossible
   * @returns {Object} Solution summary, assignments, unscheduledQueue, telemetry
   */
  static solve({
    variables = [],
    context = {},
    options = {}
  }) {
    const startTime = Date.now();
    const {
      variableHeuristic = 'MRV',
      valueHeuristic = 'LCV',
      enableForwardChecking = true,
      maxBacktracks = 10000,
      timeoutMs = 10000,
      allowPartial = true
    } = options;

    if (!Array.isArray(variables) || variables.length === 0) {
      return {
        success: true,
        isComplete: true,
        totalVariables: 0,
        scheduledCount: 0,
        unscheduledCount: 0,
        assignments: [],
        unscheduledQueue: [],
        conflicts: [],
        telemetry: {
          solveTimeMs: Date.now() - startTime,
          nodeVisits: 0,
          backtrackCount: 0,
          pruneCount: 0,
          timedOut: false,
          maxBacktracksExceeded: false
        }
      };
    }

    // Unassign all variables to ensure fresh search state
    for (const v of variables) {
      v.unassign();
      v.restoreAll();
    }

    // Map interviewers for quick property lookup
    const interviewerList = context.interviewers || [];
    const interviewerMap = new Map();
    for (const i of interviewerList) {
      interviewerMap.set(i.id, i);
    }

    // Default buffer
    const defaultBufferMinutes = typeof context.defaultBufferMinutes === 'number'
      ? context.defaultBufferMinutes
      : 15;

    // Daily Interviewer Assignment Tracker: `${interviewerId}_${date}` -> number
    const dailyInterviewerUsage = new Map();
    const existingInterviews = context.existingInterviews || [];
    for (const ex of existingInterviews) {
      if (ex.status && ex.status.toLowerCase() === 'cancelled') continue;
      const exDate = ex.date;
      const rawIds = ex.interviewerIds || ex.interviewer_ids || (ex.interviewerId ? [ex.interviewerId] : []);
      for (const id of rawIds) {
        const key = `${id}_${exDate}`;
        dailyInterviewerUsage.set(key, (dailyInterviewerUsage.get(key) || 0) + 1);
      }
    }

    // Search metrics
    let nodeVisits = 0;
    let backtrackCount = 0;
    let totalPrunes = 0;
    let timedOut = false;
    let maxBacktracksExceeded = false;

    // Track best partial solution in case search is over-constrained
    let bestAssignments = [];

    /**
     * MRV & Degree Heuristic Variable Selector
     */
    function selectNextVariable() {
      const unassigned = variables.filter(v => !v.isAssigned());
      if (unassigned.length === 0) return null;

      if (variableHeuristic === 'NATURAL') {
        return unassigned[0];
      }

      if (variableHeuristic === 'DEGREE') {
        // Sort primarily by priority (descending), then by initial domain size (descending)
        return unassigned.slice().sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return b.initialDomainSize - a.initialDomainSize;
        })[0];
      }

      // Default: Minimum Remaining Values (MRV)
      let minSize = Infinity;
      const candidates = [];

      for (const v of unassigned) {
        const size = v.getDomainSize();
        if (size < minSize) {
          minSize = size;
          candidates.length = 0;
          candidates.push(v);
        } else if (size === minSize) {
          candidates.push(v);
        }
      }

      if (candidates.length === 1) return candidates[0];

      // Degree heuristic tie-breaker: highest priority, then largest initial domain
      candidates.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.initialDomainSize - a.initialDomainSize;
      });

      return candidates[0];
    }

    /**
     * Least Constraining Value (LCV) Heuristic Value Sorter
     */
    function getOrderedDomainValues(variable) {
      const domain = variable.getRemainingDomain();
      if (valueHeuristic === 'LCV') {
        // Ascending by heuristic cost (lower cost / lower contention first)
        return domain.slice().sort((a, b) => (a.cost || 0) - (b.cost || 0));
      }
      return domain;
    }

    /**
     * Local consistency check against active assignments during search
     */
    function isAssignmentConsistent(variable, val, currentAssignments) {
      const valInterval = {
        start: val.startMinutes,
        end: val.endMinutes,
        startTime: val.startTime,
        endTime: val.endTime
      };

      for (const assigned of currentAssignments) {
        if (assigned.date !== val.date) continue;

        const assignedInterval = {
          start: assigned.startMinutes !== undefined ? assigned.startMinutes : valInterval.start,
          end: assigned.endMinutes !== undefined ? assigned.endMinutes : valInterval.end,
          startTime: assigned.startTime,
          endTime: assigned.endTime
        };

        // 1. Candidate Collision
        if (assigned.candidateId === variable.candidateId) {
          if (doIntervalsOverlap(valInterval, assignedInterval)) {
            return false;
          }
        }

        // 2. Room Collision
        if (assigned.roomId === val.roomId) {
          if (doIntervalsOverlap(valInterval, assignedInterval)) {
            return false;
          }
        }

        // 3. Interviewer Overlap & Separation Buffer
        const sharedInterviewerIds = val.interviewerIds.filter(id =>
          (assigned.interviewerIds || []).includes(id)
        );

        if (sharedInterviewerIds.length > 0) {
          // Direct overlap check
          if (doIntervalsOverlap(valInterval, assignedInterval)) {
            return false;
          }

          // Buffer check for shared interviewers
          for (const intvId of sharedInterviewerIds) {
            const intvObj = interviewerMap.get(intvId);
            const buf = intvObj && typeof intvObj.bufferMinutes === 'number'
              ? intvObj.bufferMinutes
              : defaultBufferMinutes;

            if (buf > 0 && hasBufferViolation(valInterval, assignedInterval, buf)) {
              return false;
            }
          }
        }
      }

      // 4. Daily Interviewer Cap check
      for (const intvId of val.interviewerIds) {
        const key = `${intvId}_${val.date}`;
        const currentCount = dailyInterviewerUsage.get(key) || 0;
        const intvObj = interviewerMap.get(intvId);
        const maxPerDay = intvObj && typeof intvObj.maxInterviewsPerDay === 'number'
          ? intvObj.maxInterviewsPerDay
          : 4;

        if (currentCount + 1 > maxPerDay) {
          return false;
        }
      }

      return true;
    }

    /**
     * Forward Checking: Prune incompatible values from unassigned variables
     */
    function applyForwardChecking(assignedVar, assignedVal, searchLevel) {
      const unassigned = variables.filter(v => !v.isAssigned());
      let wipeout = false;

      const assignedInterval = {
        start: assignedVal.startMinutes,
        end: assignedVal.endMinutes,
        startTime: assignedVal.startTime,
        endTime: assignedVal.endTime
      };

      for (const targetVar of unassigned) {
        const pruned = targetVar.pruneWhere(domainVal => {
          if (domainVal.date !== assignedVal.date) return false;

          const dInterval = {
            start: domainVal.startMinutes,
            end: domainVal.endMinutes,
            startTime: domainVal.startTime,
            endTime: domainVal.endTime
          };

          // A. Same candidate cannot be double-booked
          if (targetVar.candidateId === assignedVar.candidateId) {
            if (doIntervalsOverlap(dInterval, assignedInterval)) {
              return true;
            }
          }

          // B. Same room cannot be double-booked
          if (domainVal.roomId === assignedVal.roomId) {
            if (doIntervalsOverlap(dInterval, assignedInterval)) {
              return true;
            }
          }

          // C. Shared interviewer overlap or buffer violation
          const sharedIntv = domainVal.interviewerIds.filter(id =>
            assignedVal.interviewerIds.includes(id)
          );

          if (sharedIntv.length > 0) {
            if (doIntervalsOverlap(dInterval, assignedInterval)) {
              return true;
            }
            for (const intvId of sharedIntv) {
              const intvObj = interviewerMap.get(intvId);
              const buf = intvObj && typeof intvObj.bufferMinutes === 'number'
                ? intvObj.bufferMinutes
                : defaultBufferMinutes;
              if (buf > 0 && hasBufferViolation(dInterval, assignedInterval, buf)) {
                return true;
              }
            }
          }

          // D. Interviewer who has reached daily cap cannot be used on that date
          for (const intvId of domainVal.interviewerIds) {
            const key = `${intvId}_${domainVal.date}`;
            const count = dailyInterviewerUsage.get(key) || 0;
            const intvObj = interviewerMap.get(intvId);
            const maxPerDay = intvObj && typeof intvObj.maxInterviewsPerDay === 'number'
              ? intvObj.maxInterviewsPerDay
              : 4;
            if (count >= maxPerDay) {
              return true;
            }
          }

          return false;
        }, searchLevel, `Conflict with ${assignedVar.id} at level ${searchLevel}`);

        totalPrunes += pruned;

        // Domain wipeout check
        if (targetVar.getDomainSize() === 0) {
          wipeout = true;
        }
      }

      return !wipeout;
    }

    /**
     * Restore prunings done at search level
     */
    function undoForwardChecking(searchLevel) {
      for (const v of variables) {
        if (!v.isAssigned()) {
          v.restoreLevel(searchLevel);
        }
      }
    }

    /**
     * Recursive Backtracking Search Algorithm
     */
    const currentAssignments = [];

    function search(searchDepth) {
      // Check time limit
      if (Date.now() - startTime >= timeoutMs) {
        timedOut = true;
        return false;
      }

      // Check backtrack ceiling
      if (backtrackCount >= maxBacktracks) {
        maxBacktracksExceeded = true;
        return false;
      }

      const nextVar = selectNextVariable();

      // Base Case: All variables assigned successfully
      if (!nextVar) {
        bestAssignments = currentAssignments.slice();
        return true;
      }

      // If chosen variable has empty domain, fail early
      if (nextVar.getDomainSize() === 0) {
        return false;
      }

      const orderedValues = getOrderedDomainValues(nextVar);

      for (const val of orderedValues) {
        nodeVisits++;

        // 1. Check local consistency
        if (!isAssignmentConsistent(nextVar, val, currentAssignments)) {
          continue;
        }

        // 2. Assign value
        nextVar.assign(val);
        const assignmentObj = {
          ...nextVar.toAssignment(val),
          variableId: nextVar.id,
          startMinutes: val.startMinutes,
          endMinutes: val.endMinutes
        };
        currentAssignments.push(assignmentObj);

        // Update daily interviewer usage counts
        for (const intvId of val.interviewerIds) {
          const key = `${intvId}_${val.date}`;
          dailyInterviewerUsage.set(key, (dailyInterviewerUsage.get(key) || 0) + 1);
        }

        // Track best partial schedule
        if (currentAssignments.length > bestAssignments.length) {
          bestAssignments = currentAssignments.slice();
        }

        // 3. Forward Checking
        let fcOk = true;
        if (enableForwardChecking) {
          fcOk = applyForwardChecking(nextVar, val, searchDepth);
        }

        if (fcOk) {
          // 4. Recurse down search tree
          const success = search(searchDepth + 1);
          if (success) {
            return true;
          }
        }

        // 5. Backtrack: undo forward checking prunings and unassign
        if (enableForwardChecking) {
          undoForwardChecking(searchDepth);
        }

        for (const intvId of val.interviewerIds) {
          const key = `${intvId}_${val.date}`;
          const currentCount = dailyInterviewerUsage.get(key) || 0;
          if (currentCount > 1) {
            dailyInterviewerUsage.set(key, currentCount - 1);
          } else {
            dailyInterviewerUsage.delete(key);
          }
        }

        currentAssignments.pop();
        nextVar.unassign();
        backtrackCount++;

        if (backtrackCount >= maxBacktracks) {
          maxBacktracksExceeded = true;
          return false;
        }

        if (Date.now() - startTime >= timeoutMs) {
          timedOut = true;
          return false;
        }
      }

      return false;
    }

    // Execute CSP Search
    const isFullSolutionFound = search(0);

    // If full solution was found, active variables have the assignments
    let finalAssignments = [];
    if (isFullSolutionFound) {
      finalAssignments = variables.filter(v => v.isAssigned()).map(v => v.toAssignment());
    } else if (allowPartial && bestAssignments.length > 0) {
      finalAssignments = bestAssignments;
    }

    // Identify unscheduled variables
    const scheduledVarIds = new Set(finalAssignments.map(a => a.variableId || `var-${a.candidateId}-${a.roundId || 'r1'}`));
    const scheduledCandIds = new Set(finalAssignments.map(a => a.candidateId));
    const unscheduledQueue = [];
    const conflicts = [];

    for (const v of variables) {
      const isSched = scheduledVarIds.has(v.id) || scheduledCandIds.has(v.candidateId) || v.isAssigned();
      if (!isSched) {
        const unscheduledItem = {
          variableId: v.id,
          candidateId: v.candidateId,
          candidateName: v.candidate?.name || `Candidate ${v.candidateId}`,
          roundId: v.roundId,
          roundName: v.roundName,
          remainingDomainSize: v.getDomainSize(),
          initialDomainSize: v.initialDomainSize,
          diagnostics: v.diagnostics.length > 0 ? v.diagnostics : [
            { reason: 'Domain exhausted due to resource contention or overlapping candidate bookings' }
          ]
        };
        unscheduledQueue.push(unscheduledItem);
        conflicts.push({
          candidateId: v.candidateId,
          candidateName: unscheduledItem.candidateName,
          roundName: v.roundName,
          reason: v.diagnostics[0]?.reason || 'Resource contention and capacity constraints during drive'
        });
      }
    }

    // Batch validation check against Stage 3 ConstraintValidator
    const validationSummary = validateScheduleBatch(finalAssignments, {
      ...context,
      existingInterviews
    });

    const isComplete = finalAssignments.length === variables.length;

    return {
      success: isComplete || (allowPartial && finalAssignments.length > 0),
      isComplete,
      totalVariables: variables.length,
      scheduledCount: finalAssignments.length,
      unscheduledCount: unscheduledQueue.length,
      assignments: finalAssignments,
      unscheduledQueue,
      conflicts,
      validation: {
        isValid: validationSummary.every(v => v.valid),
        totalViolations: validationSummary.reduce((sum, v) => sum + v.violations.length, 0)
      },
      telemetry: {
        solveTimeMs: Date.now() - startTime,
        nodeVisits,
        backtrackCount,
        pruneCount: totalPrunes,
        timedOut,
        maxBacktracksExceeded
      }
    };
  }

  /**
   * High-level convenience entrypoint: solves a full recruitment drive from raw inputs.
   * Runs DomainGenerator followed by CspSolver.
   * 
   * @param {Object} options
   * @returns {Object}
   */
  static solveDrive({
    driveId = 'drv-101',
    roundName = 'Technical Screen',
    startDate,
    endDate,
    durationMinutes = 45,
    bufferMinutes = 15,
    candidates = [],
    interviewers = [],
    rooms = [],
    rounds = null,
    existingInterviews = [],
    context = {},
    options = {}
  }) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return {
        driveId,
        success: true,
        isComplete: true,
        totalVariables: 0,
        scheduledCount: 0,
        unscheduledCount: 0,
        assignments: [],
        unscheduledQueue: [],
        conflicts: [],
        grid: [],
        validation: { isValid: true, totalViolations: 0 },
        telemetry: {
          solveTimeMs: 0,
          nodeVisits: 0,
          backtrackCount: 0,
          pruneCount: 0,
          timedOut: false,
          maxBacktracksExceeded: false
        }
      };
    }

    const driveConfig = {
      startDate: startDate || '2026-11-02',
      endDate: endDate || startDate || '2026-11-06',
      durationMinutes: Number(durationMinutes) || 45,
      stepMinutes: options.stepMinutes || 15,
      defaultBufferMinutes: bufferMinutes !== undefined ? Number(bufferMinutes) : 15,
      roundName,
      timezone: context.timezone || 'Asia/Kolkata'
    };

    const domainGenResult = DomainGenerator.generate({
      candidates,
      rounds: rounds || roundName,
      interviewers,
      rooms,
      driveConfig,
      existingInterviews,
      context
    });

    const solverResult = CspSolver.solve({
      variables: domainGenResult.variables,
      context: {
        ...context,
        existingInterviews,
        interviewers,
        rooms,
        candidates,
        timezone: driveConfig.timezone,
        defaultBufferMinutes: driveConfig.defaultBufferMinutes
      },
      options
    });

    return {
      driveId,
      grid: domainGenResult.grid,
      ...solverResult
    };
  }
}
