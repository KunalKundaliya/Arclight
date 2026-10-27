import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DomainValue,
  CspVariable,
  DomainGenerator,
  CspSolver,
  validateAssignment,
  validateScheduleBatch
} from './index.js';

describe('Stage 4: CSP Variable Representation, Domain Generation & Backtracking Solver', () => {

  // Test Fixtures
  const candidatesFixture = [
    {
      id: 'cand-01',
      name: 'Aanya Shah',
      appliedRole: 'Senior Systems Engineer',
      skills: ['Distributed Systems', 'Go'],
      availabilityWindows: [
        { date: '2026-11-02', startTime: '09:00', endTime: '13:00' }
      ]
    },
    {
      id: 'cand-02',
      name: 'Dev Joshi',
      appliedRole: 'Distributed Systems Architect',
      skills: ['Distributed Systems', 'Rust']
    },
    {
      id: 'cand-03',
      name: 'Rohan Mehta',
      appliedRole: 'Site Reliability Engineer',
      skills: ['Distributed Systems', 'Go']
    }
  ];

  const interviewersFixture = [
    {
      id: 'int-01',
      name: 'Dr. Evelyn Voss',
      status: 'Available',
      skills: ['Distributed Systems', 'Go', 'Rust'],
      maxInterviewsPerDay: 2,
      bufferMinutes: 15,
      weeklyAvailability: {
        Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        Tuesday: ['09:00', '10:00', '11:00']
      }
    },
    {
      id: 'int-02',
      name: 'Priya Nair',
      status: 'Available',
      skills: ['Distributed Systems', 'Go', 'System Architecture'],
      maxInterviewsPerDay: 3,
      bufferMinutes: 15,
      weeklyAvailability: {
        Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        Tuesday: ['09:00', '10:00', '11:00']
      }
    },
    {
      id: 'int-03',
      name: 'Devon Thorne',
      status: 'On Leave', // Inactive faculty
      skills: ['Distributed Systems', 'Go'],
      maxInterviewsPerDay: 3,
      bufferMinutes: 15
    }
  ];

  const roomsFixture = [
    {
      id: 'rm-101',
      name: 'Chamber Alpha (C-201)',
      capacity: 4,
      type: 'Physical',
      equipment: ['Whiteboard', 'AV Display'],
      status: 'Available'
    },
    {
      id: 'rm-102',
      name: 'Chamber Beta (C-202)',
      capacity: 4,
      type: 'Physical',
      equipment: ['Whiteboard'],
      status: 'Available'
    },
    {
      id: 'rm-103',
      name: 'Chamber Gamma (C-203)',
      capacity: 2,
      type: 'Physical',
      equipment: ['Whiteboard'],
      status: 'Maintenance' // Chamber offline
    }
  ];

  // ---------------------------------------------------------------------------
  // 1. CSP Variable & Domain Value Representation
  // ---------------------------------------------------------------------------
  describe('1. CSP Variable & Domain Value Representation', () => {

    it('1.1 should construct a DomainValue with automatic minute offsets and stable ID', () => {
      const val = new DomainValue({
        date: '2026-11-02',
        startTime: '09:00',
        endTime: '09:45',
        interviewerIds: ['int-01'],
        roomId: 'rm-101'
      });

      assert.strictEqual(val.date, '2026-11-02');
      assert.strictEqual(val.startTime, '09:00');
      assert.strictEqual(val.endTime, '09:45');
      assert.strictEqual(val.startMinutes, 540);
      assert.strictEqual(val.endMinutes, 585);
      assert.strictEqual(val.id, '2026-11-02_09:00_int-01_rm-101');
      assert.ok(val.toString().includes('rm-101'));
    });

    it('1.2 should detect interval overlaps and shared resources between DomainValues', () => {
      const val1 = new DomainValue({
        date: '2026-11-02',
        startTime: '09:00',
        endTime: '09:45',
        interviewerIds: ['int-01'],
        roomId: 'rm-101'
      });

      const val2 = new DomainValue({
        date: '2026-11-02',
        startTime: '09:30',
        endTime: '10:15',
        interviewerIds: ['int-01'],
        roomId: 'rm-102'
      });

      const val3 = new DomainValue({
        date: '2026-11-02',
        startTime: '09:45',
        endTime: '10:30',
        interviewerIds: ['int-02'],
        roomId: 'rm-101'
      });

      // val1 and val2 overlap in time [09:00-09:45) and [09:30-10:15)
      assert.strictEqual(val1.overlaps(val2), true);
      assert.strictEqual(val1.sharesInterviewer(val2), true);
      assert.strictEqual(val1.sharesRoom(val2), false);

      // val1 and val3 meet at boundary 09:45 (half-open, no overlap)
      assert.strictEqual(val1.overlaps(val3), false);
      assert.strictEqual(val1.sharesRoom(val3), true);
      assert.strictEqual(val1.sharesInterviewer(val3), false);
    });

    it('1.3 should manage CspVariable assignments, unassignment and status', () => {
      const variable = new CspVariable({
        candidateId: 'cand-01',
        roundId: 'r1',
        roundName: 'Technical Screen'
      });

      assert.strictEqual(variable.isAssigned(), false);
      assert.strictEqual(variable.isUnsatisfiable(), true); // domain is initially empty

      const val = new DomainValue({
        date: '2026-11-02',
        startTime: '09:00',
        endTime: '09:45',
        interviewerIds: ['int-01'],
        roomId: 'rm-101'
      });

      variable.setInitialDomain([val]);
      assert.strictEqual(variable.getDomainSize(), 1);
      assert.strictEqual(variable.isUnsatisfiable(), false);

      variable.assign(val);
      assert.strictEqual(variable.isAssigned(), true);
      assert.strictEqual(variable.assignedValue, val);

      variable.unassign();
      assert.strictEqual(variable.isAssigned(), false);
      assert.strictEqual(variable.assignedValue, null);
    });

    it('1.4 should support reversible pruning stack and chronological backtracking', () => {
      const variable = new CspVariable({ candidateId: 'cand-01' });
      const valA = new DomainValue({ id: 'valA', date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101' });
      const valB = new DomainValue({ id: 'valB', date: '2026-11-02', startTime: '10:00', endTime: '10:45', interviewerIds: ['int-01'], roomId: 'rm-101' });
      const valC = new DomainValue({ id: 'valC', date: '2026-11-02', startTime: '11:00', endTime: '11:45', interviewerIds: ['int-01'], roomId: 'rm-101' });

      variable.setInitialDomain([valA, valB, valC]);
      assert.strictEqual(variable.getDomainSize(), 3);

      // Prune valA at level 1
      variable.pruneValue('valA', 1, 'Search level 1 branch');
      assert.strictEqual(variable.getDomainSize(), 2);
      assert.strictEqual(variable.domain.some(v => v.id === 'valA'), false);

      // Prune valB at level 2
      variable.pruneValue('valB', 2, 'Search level 2 branch');
      assert.strictEqual(variable.getDomainSize(), 1);

      // Backtrack from level 2: should restore valB but keep valA pruned
      const restoredL2 = variable.restoreLevel(2);
      assert.strictEqual(restoredL2, 1);
      assert.strictEqual(variable.getDomainSize(), 2);
      assert.ok(variable.domain.some(v => v.id === 'valB'));
      assert.strictEqual(variable.domain.some(v => v.id === 'valA'), false);

      // Backtrack from level 1: should restore valA
      const restoredL1 = variable.restoreLevel(1);
      assert.strictEqual(restoredL1, 1);
      assert.strictEqual(variable.getDomainSize(), 3);
    });

    it('1.5 should export valid assignments conforming to Stage 3 validator', () => {
      const candidate = { id: 'cand-01', name: 'Aanya Shah', appliedRole: 'Systems Lead' };
      const variable = new CspVariable({
        candidateId: 'cand-01',
        candidate,
        roundId: 'r1',
        roundName: 'System Architecture',
        durationMinutes: 45
      });

      const val = new DomainValue({
        date: '2026-11-02',
        startTime: '09:00',
        endTime: '09:45',
        interviewerIds: ['int-01'],
        roomId: 'rm-101'
      });

      variable.assign(val);
      const assignment = variable.toAssignment();

      assert.strictEqual(assignment.candidateId, 'cand-01');
      assert.strictEqual(assignment.candidateName, 'Aanya Shah');
      assert.strictEqual(assignment.date, '2026-11-02');
      assert.strictEqual(assignment.startTime, '09:00');
      assert.strictEqual(assignment.endTime, '09:45');
      assert.strictEqual(assignment.durationMinutes, 45);
      assert.deepStrictEqual(assignment.interviewerIds, ['int-01']);
      assert.strictEqual(assignment.roomId, 'rm-101');

      // Validate through Stage 3 validator
      const validation = validateAssignment(assignment, {
        candidates: [candidate],
        interviewers: [{ id: 'int-01', name: 'Dr. Voss', status: 'Available' }],
        rooms: [{ id: 'rm-101', name: 'Chamber Alpha', capacity: 4, status: 'Available' }]
      });
      assert.strictEqual(validation.valid, true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Domain Generation & Unary Constraint Filtering
  // ---------------------------------------------------------------------------
  describe('2. Domain Generation & Unary Constraint Filtering', () => {

    it('2.1 should generate discrete variables for each candidate and interview round', () => {
      const result = DomainGenerator.generate({
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      assert.strictEqual(result.variables.length, 3);
      assert.ok(result.grid.length > 0);
      assert.ok(result.totalDomainValues > 0);
    });

    it('2.2 should prune domain values outside candidate availability windows', () => {
      // cand-01 is only available 09:00 - 13:00 on 2026-11-02
      const result = DomainGenerator.generate({
        candidates: [candidatesFixture[0]], // cand-01
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '17:00',
          durationMinutes: 60,
          stepMinutes: 60
        }
      });

      const variable = result.variables[0];
      // Every remaining domain value for cand-01 must start and end before 13:00
      for (const val of variable.domain) {
        assert.ok(val.endMinutes <= 780, `Expected end time <= 13:00 (780m), got ${val.endTime} (${val.endMinutes}m)`);
      }
    });

    it('2.3 should exclude interviewers who are On Leave or have weekly schedule mismatches', () => {
      const result = DomainGenerator.generate({
        candidates: [candidatesFixture[1]], // cand-02
        interviewers: interviewersFixture, // int-03 is On Leave
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02', // Monday
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      const variable = result.variables[0];
      for (const val of variable.domain) {
        // int-03 must never be present in any generated panel
        assert.strictEqual(val.interviewerIds.includes('int-03'), false);
      }
    });

    it('2.4 should enforce required technical skills on single interviewer panels', () => {
      const result = DomainGenerator.generate({
        candidates: [
          { id: 'cand-special', name: 'Rust Specialist', skills: [] }
        ],
        rounds: [{
          roundId: 'r-rust',
          roundName: 'Rust Systems Deep Dive',
          requiredSkills: ['Rust'] // Only int-01 has Rust
        }],
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      const variable = result.variables[0];
      assert.ok(variable.domain.length > 0);
      for (const val of variable.domain) {
        assert.deepStrictEqual(val.interviewerIds, ['int-01'], 'Expected only int-01 (who has Rust skill) to be assigned');
      }
    });

    it('2.5 should formulate multi-interviewer panels and verify collective skill coverage', () => {
      const result = DomainGenerator.generate({
        candidates: [
          { id: 'cand-multi', name: 'Principal Lead Candidate', skills: [] }
        ],
        rounds: [{
          roundId: 'r-bar-raiser',
          roundName: 'Executive Bar Raiser',
          panelSize: 2,
          requiredSkills: ['Rust', 'System Architecture'] // int-01 has Rust, int-02 has System Architecture
        }],
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      const variable = result.variables[0];
      assert.ok(variable.domain.length > 0);
      for (const val of variable.domain) {
        assert.strictEqual(val.interviewerIds.length, 2);
        assert.ok(val.interviewerIds.includes('int-01'));
        assert.ok(val.interviewerIds.includes('int-02'));
      }
    });

    it('2.6 should exclude rooms in Maintenance or with insufficient capacity or missing equipment', () => {
      const result = DomainGenerator.generate({
        candidates: [candidatesFixture[0]],
        rounds: [{
          roundId: 'r1',
          roundName: 'AV Demo Round',
          requiredEquipment: ['AV Display'] // rm-101 has AV Display, rm-102 does not, rm-103 is in Maintenance
        }],
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      const variable = result.variables[0];
      assert.ok(variable.domain.length > 0);
      for (const val of variable.domain) {
        assert.strictEqual(val.roomId, 'rm-101', 'Only rm-101 meets AV Display requirement and is Available');
      }
    });

    it('2.7 should prune domain values that collide with existing locked interviews upfront', () => {
      const existingInterviews = [
        {
          id: 'intv-locked-01',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          roomId: 'rm-101',
          interviewerIds: ['int-01']
        }
      ];

      const result = DomainGenerator.generate({
        candidates: [candidatesFixture[0]], // cand-01
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        existingInterviews,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      const variable = result.variables[0];
      // 09:00 - 09:45 must NOT be present in cand-01's domain
      for (const val of variable.domain) {
        assert.notStrictEqual(val.startTime, '09:00');
      }
    });

    it('2.8 should record diagnostic root cause when variable domain is empty', () => {
      const result = DomainGenerator.generate({
        candidates: [{ id: 'cand-impossible', name: 'Impossible Candidate' }],
        rounds: [{
          roundId: 'r1',
          roundName: 'Impossible Skills',
          requiredSkills: ['Quantum Computing', 'Haskell'] // No interviewer has this
        }],
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        driveConfig: {
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          operatingStartTime: '09:00',
          operatingEndTime: '12:00',
          durationMinutes: 45,
          stepMinutes: 45
        }
      });

      const variable = result.variables[0];
      assert.strictEqual(variable.getDomainSize(), 0);
      assert.strictEqual(variable.isUnsatisfiable(), true);
      assert.ok(variable.diagnostics.length > 0);
      assert.strictEqual(result.diagnostics.length, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Variable and Value Heuristics (MRV & LCV)
  // ---------------------------------------------------------------------------
  describe('3. Variable and Value Heuristics (MRV & LCV)', () => {

    it('3.1 should select the variable with Minimum Remaining Values (MRV)', () => {
      const varA = new CspVariable({ candidateId: 'cand-A', priority: 1 });
      const varB = new CspVariable({ candidateId: 'cand-B', priority: 1 });

      const dummyVal = new DomainValue({ date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101' });

      varA.setInitialDomain([dummyVal, dummyVal, dummyVal]); // size 3
      varB.setInitialDomain([dummyVal]); // size 1

      const solverResult = CspSolver.solve({
        variables: [varA, varB],
        context: {
          interviewers: [{ id: 'int-01', maxInterviewsPerDay: 5 }],
          rooms: [{ id: 'rm-101' }]
        },
        options: { variableHeuristic: 'MRV' }
      });

      assert.ok(solverResult.telemetry.nodeVisits > 0);
    });

    it('3.2 should order domain values by Least Constraining Value (LCV)', () => {
      const varX = new CspVariable({ candidateId: 'cand-X' });
      const expensiveVal = new DomainValue({ id: 'expensive', date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101', cost: 10 });
      const cheapVal = new DomainValue({ id: 'cheap', date: '2026-11-02', startTime: '10:00', endTime: '10:45', interviewerIds: ['int-01'], roomId: 'rm-101', cost: 1 });

      varX.setInitialDomain([expensiveVal, cheapVal]);

      const solverResult = CspSolver.solve({
        variables: [varX],
        context: {
          interviewers: [{ id: 'int-01', maxInterviewsPerDay: 5 }],
          rooms: [{ id: 'rm-101' }]
        },
        options: { valueHeuristic: 'LCV' }
      });

      assert.strictEqual(solverResult.isComplete, true);
      assert.strictEqual(solverResult.assignments[0].startTime, '10:00', 'Expected cheapVal (cost 1) to be assigned before expensiveVal');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Forward Checking & Pruning
  // ---------------------------------------------------------------------------
  describe('4. Forward Checking & Pruning', () => {

    it('4.1 should prune overlapping interviewer slots on other variables', () => {
      const var1 = new CspVariable({ candidateId: 'cand-01', id: 'v1' });
      const var2 = new CspVariable({ candidateId: 'cand-02', id: 'v2' });

      // Both want slot 09:00-09:45 with int-01
      const slot1 = new DomainValue({ id: 'slot-0900', date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101' });
      const slot2 = new DomainValue({ id: 'slot-1000', date: '2026-11-02', startTime: '10:00', endTime: '10:45', interviewerIds: ['int-01'], roomId: 'rm-101' });

      var1.setInitialDomain([slot1]);
      var2.setInitialDomain([slot1, slot2]);

      const solverResult = CspSolver.solve({
        variables: [var1, var2],
        context: {
          interviewers: [{ id: 'int-01', maxInterviewsPerDay: 5, bufferMinutes: 0 }],
          rooms: [{ id: 'rm-101' }]
        },
        options: { enableForwardChecking: true }
      });

      assert.strictEqual(solverResult.isComplete, true);
      assert.strictEqual(solverResult.assignments.find(a => a.candidateId === 'cand-01').startTime, '09:00');
      assert.strictEqual(solverResult.assignments.find(a => a.candidateId === 'cand-02').startTime, '10:00');
      assert.ok(solverResult.telemetry.pruneCount > 0);
    });

    it('4.2 should prune slots violating interviewer separation buffer', () => {
      const var1 = new CspVariable({ candidateId: 'cand-01', id: 'v1' });
      const var2 = new CspVariable({ candidateId: 'cand-02', id: 'v2' });

      // int-01 has 15m buffer. If var1 takes 09:00-09:45, 09:45-10:30 has 0m gap (buffer violation!)
      const slot1 = new DomainValue({ id: 's1', date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101' });
      const slotBufferViolation = new DomainValue({ id: 's2_violation', date: '2026-11-02', startTime: '09:45', endTime: '10:30', interviewerIds: ['int-01'], roomId: 'rm-102' });
      const slotValid = new DomainValue({ id: 's3_valid', date: '2026-11-02', startTime: '10:00', endTime: '10:45', interviewerIds: ['int-01'], roomId: 'rm-102' });

      var1.setInitialDomain([slot1]);
      var2.setInitialDomain([slotBufferViolation, slotValid]);

      const solverResult = CspSolver.solve({
        variables: [var1, var2],
        context: {
          interviewers: [{ id: 'int-01', maxInterviewsPerDay: 5, bufferMinutes: 15 }],
          rooms: [{ id: 'rm-101' }, { id: 'rm-102' }]
        },
        options: { enableForwardChecking: true }
      });

      assert.strictEqual(solverResult.isComplete, true);
      assert.strictEqual(solverResult.assignments.find(a => a.candidateId === 'cand-02').startTime, '10:00');
    });

    it('4.3 should prune remaining slots when interviewer reaches daily cap', () => {
      const var1 = new CspVariable({ candidateId: 'cand-01', id: 'v1' });
      const var2 = new CspVariable({ candidateId: 'cand-02', id: 'v2' });

      // int-capped can only take 1 interview per day!
      const slot1 = new DomainValue({ id: 's1', date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-capped'], roomId: 'rm-101' });
      const slot2 = new DomainValue({ id: 's2', date: '2026-11-02', startTime: '11:00', endTime: '11:45', interviewerIds: ['int-capped'], roomId: 'rm-101' });

      var1.setInitialDomain([slot1]);
      var2.setInitialDomain([slot2]);

      const solverResult = CspSolver.solve({
        variables: [var1, var2],
        context: {
          interviewers: [{ id: 'int-capped', maxInterviewsPerDay: 1, bufferMinutes: 0 }],
          rooms: [{ id: 'rm-101' }]
        },
        options: { enableForwardChecking: true, allowPartial: true }
      });

      // Both cannot be scheduled on the same day because cap is 1
      assert.strictEqual(solverResult.isComplete, false);
      assert.strictEqual(solverResult.scheduledCount, 1);
      assert.strictEqual(solverResult.unscheduledCount, 1);
    });

    it('4.4 should trigger early backtrack on domain wipeout during forward checking', () => {
      const var1 = new CspVariable({ candidateId: 'cand-01', id: 'v1' });
      const var2 = new CspVariable({ candidateId: 'cand-02', id: 'v2' });

      // Both variables ONLY have the 09:00 slot in rm-101
      const slot1 = new DomainValue({ id: 's1', date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101' });

      var1.setInitialDomain([slot1]);
      var2.setInitialDomain([slot1]);

      const solverResult = CspSolver.solve({
        variables: [var1, var2],
        context: {
          interviewers: [{ id: 'int-01', maxInterviewsPerDay: 5 }],
          rooms: [{ id: 'rm-101' }]
        },
        options: { enableForwardChecking: true, allowPartial: false }
      });

      // Cannot satisfy both
      assert.strictEqual(solverResult.isComplete, false);
      assert.ok(solverResult.telemetry.backtrackCount > 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Complete CSP Backtracking Solver
  // ---------------------------------------------------------------------------
  describe('5. Complete CSP Backtracking Solver', () => {

    it('5.1 should solve a multi-candidate recruitment drive conflict-free', () => {
      const result = CspSolver.solveDrive({
        driveId: 'drv-webster-2026',
        roundName: 'Technical Screen',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.strictEqual(result.isComplete, true);
      assert.strictEqual(result.scheduledCount, 3);
      assert.strictEqual(result.unscheduledCount, 0);
      assert.strictEqual(result.validation.isValid, true);
      assert.strictEqual(result.validation.totalViolations, 0);
    });

    it('5.2 should produce assignments passing all Stage 3 hard constraints with 0 violations', () => {
      const result = CspSolver.solveDrive({
        driveId: 'drv-benchmark',
        roundName: 'Architecture Trial',
        startDate: '2026-11-02',
        endDate: '2026-11-03',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.strictEqual(result.isComplete, true);

      // Verify each assignment against Stage 3 validateScheduleBatch
      const validation = validateScheduleBatch(result.assignments, {
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      for (const item of validation) {
        assert.strictEqual(item.valid, true, `Validation failed: ${JSON.stringify(item.violations)}`);
        assert.strictEqual(item.violations.length, 0);
      }
    });

    it('5.3 should distribute assignments without exceeding interviewer daily caps', () => {
      // 5 candidates on a single day. Dr. Voss has max 2, Priya Nair has max 3 (total 5)
      const fiveCandidates = [
        ...candidatesFixture,
        { id: 'cand-04', name: 'Neha Kapoor', skills: ['Distributed Systems'] },
        { id: 'cand-05', name: 'Mira Patel', skills: ['Distributed Systems'] }
      ];

      const result = CspSolver.solveDrive({
        driveId: 'drv-cap-test',
        roundName: 'Distributed Systems',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: fiveCandidates,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.strictEqual(result.isComplete, true);
      assert.strictEqual(result.scheduledCount, 5);

      // Verify counts per interviewer
      const vossCount = result.assignments.filter(a => a.interviewerIds.includes('int-01')).length;
      const nairCount = result.assignments.filter(a => a.interviewerIds.includes('int-02')).length;

      assert.ok(vossCount <= 2, `Dr. Voss exceeded daily cap of 2: got ${vossCount}`);
      assert.ok(nairCount <= 3, `Priya Nair exceeded daily cap of 3: got ${nairCount}`);
      assert.strictEqual(vossCount + nairCount, 5);
    });

    it('5.4 should enforce separation buffer between consecutive interviews for same interviewer', () => {
      const result = CspSolver.solveDrive({
        driveId: 'drv-buffer-test',
        roundName: 'Screening',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: candidatesFixture.slice(0, 2),
        interviewers: [interviewersFixture[0]], // Only Dr. Voss available (max 2 interviews)
        rooms: roomsFixture
      });

      assert.strictEqual(result.scheduledCount, 2);
      const [first, second] = result.assignments.sort((a, b) => a.startTime.localeCompare(b.startTime));

      // [09:00-09:45) and next cannot start until 10:00 (15m buffer)
      assert.strictEqual(first.endTime, '09:45');
      assert.ok(second.startTime >= '10:00', `Expected second interview start >= 10:00, got ${second.startTime}`);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Edge Cases, Over-constrained Problems & Safety Limits
  // ---------------------------------------------------------------------------
  describe('6. Edge Cases, Over-constrained Problems & Safety Limits', () => {

    it('6.1 should handle over-constrained drives and return maximal partial schedule with diagnostics', () => {
      // 5 candidates, but only 1 room and 1 interviewer with cap of 2 interviews!
      const fiveCandidates = [
        ...candidatesFixture,
        { id: 'cand-04', name: 'Neha Kapoor' },
        { id: 'cand-05', name: 'Mira Patel' }
      ];

      const result = CspSolver.solveDrive({
        driveId: 'drv-overconstrained',
        roundName: 'Solo Trial',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: fiveCandidates,
        interviewers: [
          { id: 'int-solo', name: 'Solo Faculty', status: 'Available', maxInterviewsPerDay: 2, bufferMinutes: 15 }
        ],
        rooms: [roomsFixture[0]]
      });

      assert.strictEqual(result.isComplete, false);
      assert.strictEqual(result.scheduledCount, 2);
      assert.strictEqual(result.unscheduledCount, 3);
      assert.strictEqual(result.unscheduledQueue.length, 3);
      assert.ok(result.conflicts.length > 0);
    });

    it('6.2 should respect maxBacktracks limit and abort gracefully', () => {
      const var1 = new CspVariable({ candidateId: 'cand-01', id: 'v1' });
      const var2 = new CspVariable({ candidateId: 'cand-02', id: 'v2' });
      const slot = new DomainValue({ date: '2026-11-02', startTime: '09:00', endTime: '09:45', interviewerIds: ['int-01'], roomId: 'rm-101' });

      var1.setInitialDomain([slot]);
      var2.setInitialDomain([slot]);

      const solverResult = CspSolver.solve({
        variables: [var1, var2],
        context: { interviewers: [{ id: 'int-01', maxInterviewsPerDay: 1 }], rooms: [{ id: 'rm-101' }] },
        options: { maxBacktracks: 1, allowPartial: true }
      });

      assert.strictEqual(solverResult.telemetry.maxBacktracksExceeded, true);
    });

    it('6.3 should respect timeoutMs limit gracefully', () => {
      const solverResult = CspSolver.solve({
        variables: [new CspVariable({ candidateId: 'cand-01' })],
        options: { timeoutMs: 0 } // Immediate timeout
      });

      assert.strictEqual(solverResult.telemetry.timedOut, true);
    });

    it('6.4 should handle empty candidate list without error', () => {
      const result = CspSolver.solveDrive({
        candidates: [],
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isComplete, true);
      assert.strictEqual(result.scheduledCount, 0);
      assert.strictEqual(result.assignments.length, 0);
    });
  });
});
