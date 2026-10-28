/**
 * ArcLight - Stage 5 Local Search Schedule Optimizer
 * 
 * Takes a feasible schedule produced by Stage 4 CSP Solver and applies
 * iterative local search (Hill Climbing / Simulated Annealing) to optimize
 * soft constraints:
 * - Balancing faculty interview workload
 * - Eliminating back-to-back faculty fatigue
 * - Consolidating idle time and fragmented gaps
 * - Reducing chamber transitions
 * - Maximizing skill affinity
 * 
 * Architectural Guarantee:
 * Every proposed neighborhood move is strictly validated against Stage 3
 * ConstraintValidator; hard constraints are NEVER compromised.
 */

import { SoftConstraintEvaluator, DEFAULT_OBJECTIVE_WEIGHTS } from './SoftConstraintEvaluator.js';
import { validateScheduleBatch } from './ConstraintValidator.js';

export class ScheduleOptimizer {
  /**
   * Optimizes a feasible schedule using iterative local search.
   * 
   * @param {Object} params
   * @param {Array<Object>} params.assignments - Feasible schedule from Stage 4
   * @param {Object} [params.context={}] - Context with interviewers, rooms, candidates, etc.
   * @param {Object} [params.options={}] - Optimization parameters
   * @param {'SIMULATED_ANNEALING'|'HILL_CLIMBING'} [params.options.algorithm='SIMULATED_ANNEALING']
   * @param {number} [params.options.maxIterations=250] - Maximum search iterations
   * @param {number} [params.options.timeoutMs=5000] - Search timeout
   * @param {number} [params.options.initialTemperature=100] - Initial temperature for SA
   * @param {number} [params.options.coolingRate=0.96] - Temperature cooling rate
   * @param {Object} [params.options.weights=DEFAULT_OBJECTIVE_WEIGHTS] - Custom objective weights
   * @returns {Object}
   */
  static optimize({
    assignments = [],
    context = {},
    options = {}
  }) {
    const startTime = Date.now();

    if (!Array.isArray(assignments) || assignments.length <= 1) {
      const initialEval = SoftConstraintEvaluator.evaluateSchedule(assignments, context);
      return {
        success: true,
        initialScore: initialEval,
        optimizedScore: initialEval,
        improvementPercent: 0,
        penaltyReduction: 0,
        movesAttempted: 0,
        movesAccepted: 0,
        iterationsRun: 0,
        optimizationTimeMs: Date.now() - startTime,
        assignments: assignments.slice(),
        validation: { isValid: true, totalViolations: 0 }
      };
    }

    const {
      algorithm = 'SIMULATED_ANNEALING',
      maxIterations = 250,
      timeoutMs = 5000,
      initialTemperature = 100,
      coolingRate = 0.96,
      weights = DEFAULT_OBJECTIVE_WEIGHTS
    } = options;

    const initialEval = SoftConstraintEvaluator.evaluateSchedule(assignments, context, weights);

    let currentAssignments = assignments.map(a => ({ ...a }));
    let currentEval = initialEval;

    let bestAssignments = currentAssignments.map(a => ({ ...a }));
    let bestEval = currentEval;

    let temperature = initialTemperature;
    let movesAttempted = 0;
    let movesAccepted = 0;
    let iterations = 0;

    const availableRooms = (context.rooms || []).filter(r => r.status !== 'Maintenance');
    const availableInterviewers = (context.interviewers || []).filter(i => i.status !== 'On Leave');

    // Helper: Clone schedule
    function cloneSchedule(sched) {
      return sched.map(a => ({
        ...a,
        interviewerIds: [...(a.interviewerIds || [])],
        interviewerNames: [...(a.interviewerNames || [])]
      }));
    }

    // Helper: Verify hard constraints
    function isValidSchedule(sched) {
      const results = validateScheduleBatch(sched, context);
      return results.every(r => r.valid);
    }

    // Main Iterative Local Search Loop
    while (iterations < maxIterations && (Date.now() - startTime) < timeoutMs) {
      iterations++;

      // Pick a random neighborhood perturbation operator:
      // 0: Chamber Reassignment (reduces room switches)
      // 1: Interviewer Swap between compatible sessions (balances workload & fatigue)
      // 2: Time Slot Swap between two candidates
      const operatorChoice = Math.floor(Math.random() * 3);
      let candidateNeighbor = null;

      if (operatorChoice === 0 && availableRooms.length > 1) {
        // Operator: Switch room to an alternative eligible chamber
        const targetIdx = Math.floor(Math.random() * currentAssignments.length);
        const target = currentAssignments[targetIdx];
        const alternativeRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];

        if (alternativeRoom.id !== target.roomId) {
          candidateNeighbor = cloneSchedule(currentAssignments);
          candidateNeighbor[targetIdx].roomId = alternativeRoom.id;
          candidateNeighbor[targetIdx].roomName = alternativeRoom.name;
        }
      } else if (operatorChoice === 1 && availableInterviewers.length > 1) {
        // Operator: Swap interviewer between two sessions on the same or different days
        const idxA = Math.floor(Math.random() * currentAssignments.length);
        const idxB = Math.floor(Math.random() * currentAssignments.length);

        if (idxA !== idxB) {
          const assignA = currentAssignments[idxA];
          const assignB = currentAssignments[idxB];

          candidateNeighbor = cloneSchedule(currentAssignments);
          // Swap single interviewer panels
          if (assignA.interviewerIds.length === 1 && assignB.interviewerIds.length === 1) {
            const tempId = candidateNeighbor[idxA].interviewerIds[0];
            const tempName = candidateNeighbor[idxA].interviewerNames?.[0];

            candidateNeighbor[idxA].interviewerIds = [candidateNeighbor[idxB].interviewerIds[0]];
            candidateNeighbor[idxA].interviewerNames = candidateNeighbor[idxB].interviewerNames ? [candidateNeighbor[idxB].interviewerNames[0]] : [];

            candidateNeighbor[idxB].interviewerIds = [tempId];
            candidateNeighbor[idxB].interviewerNames = tempName ? [tempName] : [];
          }
        }
      } else {
        // Operator: Swap full time slots between two candidates
        const idxA = Math.floor(Math.random() * currentAssignments.length);
        const idxB = Math.floor(Math.random() * currentAssignments.length);

        if (idxA !== idxB) {
          const aA = currentAssignments[idxA];
          const aB = currentAssignments[idxB];

          candidateNeighbor = cloneSchedule(currentAssignments);
          // Swap timing
          const tempDate = candidateNeighbor[idxA].date;
          const tempStart = candidateNeighbor[idxA].startTime;
          const tempEnd = candidateNeighbor[idxA].endTime;
          const tempStartMin = candidateNeighbor[idxA].startMinutes;
          const tempEndMin = candidateNeighbor[idxA].endMinutes;

          candidateNeighbor[idxA].date = candidateNeighbor[idxB].date;
          candidateNeighbor[idxA].startTime = candidateNeighbor[idxB].startTime;
          candidateNeighbor[idxA].endTime = candidateNeighbor[idxB].endTime;
          candidateNeighbor[idxA].startMinutes = candidateNeighbor[idxB].startMinutes;
          candidateNeighbor[idxA].endMinutes = candidateNeighbor[idxB].endMinutes;

          candidateNeighbor[idxB].date = tempDate;
          candidateNeighbor[idxB].startTime = tempStart;
          candidateNeighbor[idxB].endTime = tempEnd;
          candidateNeighbor[idxB].startMinutes = tempStartMin;
          candidateNeighbor[idxB].endMinutes = tempEndMin;
        }
      }

      if (!candidateNeighbor) continue;
      movesAttempted++;

      // Strict Stage 3 Hard-Constraint Verification
      if (!isValidSchedule(candidateNeighbor)) {
        continue;
      }

      // Evaluate soft constraints of candidate neighbor
      const neighborEval = SoftConstraintEvaluator.evaluateSchedule(candidateNeighbor, context, weights);
      const deltaPenalty = neighborEval.totalPenalty - currentEval.totalPenalty;

      let acceptMove = false;

      if (deltaPenalty < 0) {
        // Improving move: always accept
        acceptMove = true;
      } else if (algorithm === 'SIMULATED_ANNEALING' && temperature > 0.01) {
        // Suboptimal move: accept probabilistically based on temperature
        const acceptanceProbability = Math.exp(-deltaPenalty / temperature);
        if (Math.random() < acceptanceProbability) {
          acceptMove = true;
        }
      }

      if (acceptMove) {
        currentAssignments = candidateNeighbor;
        currentEval = neighborEval;
        movesAccepted++;

        // Track global best
        if (currentEval.totalPenalty < bestEval.totalPenalty) {
          bestAssignments = cloneSchedule(currentAssignments);
          bestEval = currentEval;
        }
      }

      // Geometric cooling for Simulated Annealing
      if (algorithm === 'SIMULATED_ANNEALING') {
        temperature *= coolingRate;
      }
    }

    const optimizationTimeMs = Date.now() - startTime;
    const penaltyReduction = Number((initialEval.totalPenalty - bestEval.totalPenalty).toFixed(2));
    const improvementPercent = initialEval.totalPenalty > 0
      ? Number(((penaltyReduction / initialEval.totalPenalty) * 100).toFixed(1))
      : 0;

    return {
      success: true,
      initialScore: initialEval,
      optimizedScore: bestEval,
      improvementPercent: Math.max(0, improvementPercent),
      penaltyReduction: Math.max(0, penaltyReduction),
      movesAttempted,
      movesAccepted,
      iterationsRun: iterations,
      optimizationTimeMs,
      assignments: bestAssignments,
      validation: {
        isValid: true,
        totalViolations: 0
      }
    };
  }
}
