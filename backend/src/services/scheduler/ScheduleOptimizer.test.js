import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SoftConstraintEvaluator,
  ScheduleOptimizer,
  validateScheduleBatch,
  CspSolver
} from './index.js';

describe('Stage 5: Soft-Constraint Optimization & Scoring Engine', () => {

  // Test Fixtures
  const interviewersFixture = [
    {
      id: 'int-01',
      name: 'Dr. Evelyn Voss',
      skills: ['Distributed Systems', 'Go', 'Rust'],
      status: 'Available',
      maxInterviewsPerDay: 4,
      bufferMinutes: 15
    },
    {
      id: 'int-02',
      name: 'Priya Nair',
      skills: ['Distributed Systems', 'System Architecture', 'Go'],
      status: 'Available',
      maxInterviewsPerDay: 4,
      bufferMinutes: 15
    },
    {
      id: 'int-03',
      name: 'Marcus Sterling',
      skills: ['Leadership & Fit', 'System Design'],
      status: 'Available',
      maxInterviewsPerDay: 4,
      bufferMinutes: 15
    }
  ];

  const roomsFixture = [
    { id: 'rm-101', name: 'Chamber Alpha', capacity: 4, status: 'Available' },
    { id: 'rm-102', name: 'Chamber Beta', capacity: 4, status: 'Available' }
  ];

  const candidatesFixture = [
    { id: 'cand-01', name: 'Aanya Shah', skills: ['Distributed Systems', 'Go', 'Rust'] },
    { id: 'cand-02', name: 'Dev Joshi', skills: ['Distributed Systems', 'Rust'] },
    { id: 'cand-03', name: 'Rohan Mehta', skills: ['Distributed Systems', 'Go'] },
    { id: 'cand-04', name: 'Neha Kapoor', skills: ['Distributed Systems', 'System Architecture'] }
  ];

  // ---------------------------------------------------------------------------
  // 1. Workload Balance Evaluation
  // ---------------------------------------------------------------------------
  describe('1. Workload Balance Evaluation', () => {

    it('1.1 should score 100/100 with zero penalty when workload is perfectly balanced', () => {
      // 3 interviewers, 2 interviews each
      const balancedSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '10:00', endTime: '10:45' },
        { id: 'a3', interviewerIds: ['int-02'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a4', interviewerIds: ['int-02'], date: '2026-11-02', startTime: '10:00', endTime: '10:45' },
        { id: 'a5', interviewerIds: ['int-03'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a6', interviewerIds: ['int-03'], date: '2026-11-02', startTime: '10:00', endTime: '10:45' }
      ];

      const res = SoftConstraintEvaluator.evaluateWorkloadBalance(balancedSchedule, {
        interviewers: interviewersFixture
      });

      assert.strictEqual(res.score, 100);
      assert.strictEqual(res.penalty, 0);
      assert.strictEqual(res.metrics.stdDev, 0);
      assert.strictEqual(res.metrics.spread, 0);
    });

    it('1.2 should heavily penalize skewed faculty workloads', () => {
      // int-01 has 5 interviews, int-02 has 1, int-03 has 0
      const skewedSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '10:00', endTime: '10:45' },
        { id: 'a3', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '11:00', endTime: '11:45' },
        { id: 'a4', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '14:00', endTime: '14:45' },
        { id: 'a5', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '15:00', endTime: '15:45' },
        { id: 'a6', interviewerIds: ['int-02'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' }
      ];

      const res = SoftConstraintEvaluator.evaluateWorkloadBalance(skewedSchedule, {
        interviewers: interviewersFixture
      });

      assert.ok(res.penalty > 20, `Expected penalty > 20, got ${res.penalty}`);
      assert.ok(res.score < 60, `Expected score < 60, got ${res.score}`);
      assert.strictEqual(res.metrics.spread, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Fatigue & Rest Evaluation
  // ---------------------------------------------------------------------------
  describe('2. Fatigue & Rest Evaluation', () => {

    it('2.1 should detect and penalize 3+ consecutive sessions without extended rest breaks', () => {
      // 3 consecutive sessions with only 15m buffer (less than 30m)
      const fatigueSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '10:00', endTime: '10:45' },
        { id: 'a3', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '11:00', endTime: '11:45' }
      ];

      const res = SoftConstraintEvaluator.evaluateInterviewerFatigue(fatigueSchedule);
      assert.ok(res.penalty > 0);
      assert.ok(res.metrics.backToBackRuns >= 1);
      assert.ok(res.metrics.longStretches >= 1);
    });

    it('2.2 should award full 100/100 score when faculty receive ample rest (>= 30 mins) between sessions', () => {
      const restfulSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '10:30', endTime: '11:15' }, // 45m break!
        { id: 'a3', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '14:00', endTime: '14:45' }  // 2h45m break!
      ];

      const res = SoftConstraintEvaluator.evaluateInterviewerFatigue(restfulSchedule);
      assert.strictEqual(res.score, 100);
      assert.strictEqual(res.penalty, 0);
      assert.strictEqual(res.metrics.backToBackRuns, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Compactness & Idle Time Evaluation
  // ---------------------------------------------------------------------------
  describe('3. Compactness & Idle Time Evaluation', () => {

    it('3.1 should penalize fragmented schedules with awkward 2 to 3-hour waiting lulls', () => {
      const fragmentedSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '12:00', endTime: '12:45' } // 2h15m (135m) awkward gap
      ];

      const res = SoftConstraintEvaluator.evaluateScheduleCompactness(fragmentedSchedule);
      assert.ok(res.penalty > 0);
      assert.strictEqual(res.metrics.fragmentedGapsCount, 1);
      assert.strictEqual(res.metrics.totalWastedMinutes, 135);
    });

    it('3.2 should score 100/100 for schedules without awkward fragmented lulls', () => {
      const compactSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '10:15', endTime: '11:00' } // 30m clean gap
      ];

      const res = SoftConstraintEvaluator.evaluateScheduleCompactness(compactSchedule);
      assert.strictEqual(res.score, 100);
      assert.strictEqual(res.penalty, 0);
      assert.strictEqual(res.metrics.fragmentedGapsCount, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Room Stability Evaluation
  // ---------------------------------------------------------------------------
  describe('4. Room Stability Evaluation', () => {

    it('4.1 should penalize unnecessary chamber switches for back-to-back interviews', () => {
      const hoppingSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], roomId: 'rm-101', date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], roomId: 'rm-102', date: '2026-11-02', startTime: '10:00', endTime: '10:45' } // Switched to rm-102!
      ];

      const res = SoftConstraintEvaluator.evaluateRoomStability(hoppingSchedule);
      assert.ok(res.penalty > 0);
      assert.strictEqual(res.metrics.roomSwitchesCount, 1);
      assert.ok(res.score < 100);
    });

    it('4.2 should award 100/100 when an interviewer remains in the same chamber', () => {
      const stableSchedule = [
        { id: 'a1', interviewerIds: ['int-01'], roomId: 'rm-101', date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', interviewerIds: ['int-01'], roomId: 'rm-101', date: '2026-11-02', startTime: '10:00', endTime: '10:45' }
      ];

      const res = SoftConstraintEvaluator.evaluateRoomStability(stableSchedule);
      assert.strictEqual(res.score, 100);
      assert.strictEqual(res.penalty, 0);
      assert.strictEqual(res.metrics.roomSwitchesCount, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Skill Affinity Evaluation
  // ---------------------------------------------------------------------------
  describe('5. Skill Affinity Evaluation', () => {

    it('5.1 should reward panels with full domain skill overlap', () => {
      const highAffinitySchedule = [
        {
          id: 'a1',
          candidateId: 'cand-01', // Skills: ['Distributed Systems', 'Go', 'Rust']
          interviewerIds: ['int-01'], // Skills: ['Distributed Systems', 'Go', 'Rust'] (100% overlap)
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45'
        }
      ];

      const res = SoftConstraintEvaluator.evaluateSkillAffinity(highAffinitySchedule, {
        candidates: candidatesFixture,
        interviewers: interviewersFixture
      });

      assert.strictEqual(res.score, 100);
      assert.strictEqual(res.penalty, 0);
      assert.strictEqual(res.metrics.averageAffinityRatio, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Composite Multi-Objective Scoring
  // ---------------------------------------------------------------------------
  describe('6. Composite Multi-Objective Scoring', () => {

    it('6.1 should compute composite fitness score and assign appropriate grade', () => {
      const schedule = [
        { id: 'a1', candidateId: 'cand-01', interviewerIds: ['int-01'], roomId: 'rm-101', date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', candidateId: 'cand-02', interviewerIds: ['int-02'], roomId: 'rm-101', date: '2026-11-02', startTime: '10:00', endTime: '10:45' }
      ];

      const report = SoftConstraintEvaluator.evaluateSchedule(schedule, {
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.ok(typeof report.fitnessScore === 'number');
      assert.ok(report.fitnessScore >= 0 && report.fitnessScore <= 100);
      assert.ok(['A+', 'A', 'B', 'C', 'D', 'F'].includes(report.grade));
      assert.ok(report.breakdown.workloadBalance);
      assert.ok(report.breakdown.fatiguePrevention);
      assert.ok(report.breakdown.scheduleCompactness);
      assert.ok(report.breakdown.roomStability);
      assert.ok(report.breakdown.skillAffinity);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Iterative Local Search Optimization
  // ---------------------------------------------------------------------------
  describe('7. Iterative Local Search Optimization', () => {

    it('7.1 should optimize room stability by reducing chamber hops via room switches', () => {
      // Suboptimal initial schedule: Dr. Voss (int-01) switches between rm-101 and rm-102
      // rm-101 is free at 10:00! So optimizer should switch session a2 to rm-101 to keep room stability.
      const initialSchedule = [
        { id: 'a1', candidateId: 'cand-01', interviewerIds: ['int-01'], roomId: 'rm-101', roomName: 'Chamber Alpha', date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
        { id: 'a2', candidateId: 'cand-02', interviewerIds: ['int-01'], roomId: 'rm-102', roomName: 'Chamber Beta', date: '2026-11-02', startTime: '10:00', endTime: '10:45' }
      ];

      const optResult = ScheduleOptimizer.optimize({
        assignments: initialSchedule,
        context: {
          candidates: candidatesFixture,
          interviewers: interviewersFixture,
          rooms: roomsFixture
        },
        options: {
          algorithm: 'HILL_CLIMBING',
          maxIterations: 100
        }
      });

      assert.strictEqual(optResult.success, true);
      assert.ok(optResult.optimizedScore.fitnessScore >= optResult.initialScore.fitnessScore);
      assert.strictEqual(optResult.validation.isValid, true);
      assert.strictEqual(optResult.validation.totalViolations, 0);
    });

    it('7.2 should optimize full recruitment drive schedule using Simulated Annealing', () => {
      // Solve feasible drive with Stage 4 CSP Solver
      const feasibleResult = CspSolver.solveDrive({
        driveId: 'drv-opt-test',
        roundName: 'Technical Screen',
        startDate: '2026-11-02',
        endDate: '2026-11-03',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.strictEqual(feasibleResult.isComplete, true);

      // Apply Stage 5 Local Search Optimizer
      const optResult = ScheduleOptimizer.optimize({
        assignments: feasibleResult.assignments,
        context: {
          candidates: candidatesFixture,
          interviewers: interviewersFixture,
          rooms: roomsFixture
        },
        options: {
          algorithm: 'SIMULATED_ANNEALING',
          maxIterations: 150,
          initialTemperature: 50,
          coolingRate: 0.95
        }
      });

      assert.strictEqual(optResult.success, true);
      assert.ok(optResult.optimizedScore.fitnessScore >= optResult.initialScore.fitnessScore);
      assert.ok(optResult.movesAttempted > 0);

      // Verify that NO hard constraints were violated
      const batchValidation = validateScheduleBatch(optResult.assignments, {
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });
      assert.ok(batchValidation.every(v => v.valid), 'All optimized assignments must remain 100% hard-constraint valid');
    });

    it('7.3 should handle empty and single-element schedules gracefully', () => {
      const emptyResult = ScheduleOptimizer.optimize({ assignments: [] });
      assert.strictEqual(emptyResult.success, true);
      assert.strictEqual(emptyResult.assignments.length, 0);

      const singleSchedule = [
        { id: 'single', candidateId: 'c1', interviewerIds: ['int-01'], roomId: 'rm-101', date: '2026-11-02', startTime: '09:00', endTime: '09:45' }
      ];
      const singleResult = ScheduleOptimizer.optimize({ assignments: singleSchedule });
      assert.strictEqual(singleResult.success, true);
      assert.strictEqual(singleResult.assignments.length, 1);
    });
  });
});
