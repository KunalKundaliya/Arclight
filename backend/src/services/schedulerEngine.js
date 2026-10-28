/**
 * ArcLight - Backend Deterministic Constraint-Satisfaction Engine
 * 
 * Powered by Stage 4 CspSolver:
 * Evaluates candidate-panel-room pairings against availability,
 * max interviews per day, room capacity, equipment, and buffer times
 * using MRV heuristics, LCV value ordering, and Forward Checking.
 */

import { CspSolver } from './scheduler/index.js';

export class BackendSchedulerEngine {
  static solve({
    driveId = 'drv-101',
    roundName = 'Technical Screen',
    startDate = '2026-11-02',
    endDate = '2026-11-06',
    durationMinutes = 45,
    bufferMinutes = 15,
    candidates = [],
    interviewers = [],
    rooms = [],
    options = {}
  }) {
    const activeRooms = rooms.length > 0 ? rooms : [
      { id: 'rm-101', name: 'Chamber Alpha (C-201)', capacity: 4, type: 'Physical', status: 'Available' },
      { id: 'rm-102', name: 'Chamber Beta (C-202)', capacity: 4, type: 'Physical', status: 'Available' },
      { id: 'rm-103', name: 'Chamber Gamma (C-203)', capacity: 6, type: 'Physical', status: 'Available' }
    ];

    const activeInterviewers = interviewers.length > 0 ? interviewers : [
      { id: 'int-01', name: 'Dr. Evelyn Voss', maxInterviewsPerDay: 3, status: 'Available', bufferMinutes: 15 },
      { id: 'int-02', name: 'Priya Nair', maxInterviewsPerDay: 4, status: 'Available', bufferMinutes: 15 },
      { id: 'int-03', name: 'Devon Thorne', maxInterviewsPerDay: 3, status: 'Available', bufferMinutes: 15 },
      { id: 'int-04', name: 'Aria Chen', maxInterviewsPerDay: 3, status: 'Available', bufferMinutes: 15 }
    ];

    const candidatePool = candidates.length > 0 ? [...candidates] : [
      { id: 'cand-01', name: 'Aanya Shah', appliedRole: 'Senior Systems Engineer' },
      { id: 'cand-02', name: 'Dev Joshi', appliedRole: 'Distributed Systems Architect' },
      { id: 'cand-03', name: 'Rohan Mehta', appliedRole: 'Site Reliability Engineer' },
      { id: 'cand-04', name: 'Neha Kapoor', appliedRole: 'Full-Stack Performance Lead' },
      { id: 'cand-05', name: 'Mira Patel', appliedRole: 'Cloud Security Engineer' }
    ];

    const interviewerMap = new Map(activeInterviewers.map(i => [i.id, i]));
    const roomMap = new Map(activeRooms.map(r => [r.id, r]));

    // Execute Stage 4 CSP Engine
    const solverResult = CspSolver.solveDrive({
      driveId,
      roundName,
      startDate,
      endDate,
      durationMinutes,
      bufferMinutes,
      candidates: candidatePool,
      interviewers: activeInterviewers,
      rooms: activeRooms,
      options: {
        stepMinutes: 15,
        variableHeuristic: 'MRV',
        valueHeuristic: 'LCV',
        enableForwardChecking: true,
        allowPartial: true,
        ...options
      }
    });

    let intvCounter = 1;
    const formattedAssignments = (solverResult.assignments || []).map(a => {
      const interviewerNames = (a.interviewerIds || []).map(
        id => interviewerMap.get(id)?.name || id
      );
      const roomObj = roomMap.get(a.roomId);

      return {
        id: a.id || `intv-csp-${intvCounter++}`,
        driveId,
        candidateId: a.candidateId,
        candidateName: a.candidateName || `Candidate ${a.candidateId}`,
        candidateRole: a.candidateRole || 'Software Development Engineer',
        roundType: a.roundType || roundName || 'Technical Screen',
        roundTitle: a.roundTitle || `${roundName || 'Technical Screen'} · ${a.candidateName}`,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        duration: `${a.durationMinutes || durationMinutes} min`,
        durationMinutes: a.durationMinutes || durationMinutes,
        interviewerIds: a.interviewerIds || [],
        interviewerNames,
        roomId: a.roomId,
        roomName: roomObj?.name || a.roomId,
        status: 'Scheduled',
        evaluationStatus: 'Pending',
        meetingUrl: `https://meet.arclight.io/trial-${a.candidateId}-${a.roundId || 'r1'}`
      };
    });

    return {
      success: solverResult.success,
      solver: 'ArcLight CSP Engine (Deterministic v2.0 - Stage 4)',
      totalVariablesEvaluated: solverResult.telemetry?.nodeVisits || candidatePool.length,
      solutionFound: solverResult.isComplete,
      solveTimeMs: solverResult.telemetry?.solveTimeMs || 0,
      telemetry: solverResult.telemetry,
      validation: solverResult.validation,
      metrics: {
        totalRequested: candidatePool.length,
        scheduledCount: formattedAssignments.length,
        conflictCount: (solverResult.conflicts || []).length,
        unscheduledCount: (solverResult.unscheduledQueue || []).length,
        fulfillmentRate: candidatePool.length > 0
          ? `${Math.round((formattedAssignments.length / candidatePool.length) * 100)}%`
          : '100%'
      },
      assignments: formattedAssignments,
      conflicts: solverResult.conflicts || [],
      unscheduledQueue: solverResult.unscheduledQueue || []
    };
  }
}
