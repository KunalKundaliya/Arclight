import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DynamicRepairEngine,
  validateScheduleBatch,
  CspSolver
} from './index.js';

describe('Stage 6: Dynamic Rescheduling & Minimal-Displacement Repair Engine', () => {

  // Test Fixtures
  const interviewersFixture = [
    {
      id: 'int-01',
      name: 'Dr. Evelyn Voss',
      skills: ['Distributed Systems', 'Go', 'Rust'],
      status: 'Available',
      maxInterviewsPerDay: 4,
      bufferMinutes: 15,
      weeklyAvailability: {
        Monday: ['09:00', '10:00', '11:00', '14:00', '15:00']
      }
    },
    {
      id: 'int-02',
      name: 'Priya Nair',
      skills: ['Distributed Systems', 'Go', 'Rust'],
      status: 'Available',
      maxInterviewsPerDay: 4,
      bufferMinutes: 15,
      weeklyAvailability: {
        Monday: ['09:00', '10:00', '11:00', '14:00', '15:00']
      }
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
    { id: 'rm-101', name: 'Chamber Alpha', capacity: 4, status: 'Available', equipment: ['Whiteboard', 'AV Display'] },
    { id: 'rm-102', name: 'Chamber Beta', capacity: 4, status: 'Available', equipment: ['Whiteboard'] },
    { id: 'rm-103', name: 'Chamber Gamma', capacity: 6, status: 'Available', equipment: ['Whiteboard', 'AV Display'] }
  ];

  const candidatesFixture = [
    { id: 'cand-01', name: 'Aanya Shah', skills: ['Distributed Systems', 'Go'] },
    { id: 'cand-02', name: 'Dev Joshi', skills: ['Distributed Systems', 'Rust'] },
    { id: 'cand-03', name: 'Rohan Mehta', skills: ['Distributed Systems', 'Go'] }
  ];

  // ---------------------------------------------------------------------------
  // 1. Faculty Call-Out / Substitute Assessor (Tier 1: Zero Candidate Displacement)
  // ---------------------------------------------------------------------------
  describe('1. Faculty Call-Out / Substitute Assessor', () => {

    it('1.1 should substitute an unavailable faculty member with zero candidate time displacement', () => {
      // Dr. Voss (int-01) is booked for cand-01 at 09:00-09:45 in rm-101
      // Priya Nair (int-02) is free at 09:00
      const activeSchedule = [
        {
          id: 'intv-01',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          requiredSkills: ['Distributed Systems', 'Go'],
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101',
          roomName: 'Chamber Alpha'
        }
      ];

      // Dr. Voss calls out sick on Monday 2026-11-02
      const repairResult = DynamicRepairEngine.handleInterviewerCallout({
        schedule: activeSchedule,
        interviewerId: 'int-01',
        date: '2026-11-02',
        context: {
          interviewers: interviewersFixture,
          rooms: roomsFixture,
          candidates: candidatesFixture
        }
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.affectedCount, 1);
      assert.strictEqual(repairResult.repairedCount, 1);
      assert.strictEqual(repairResult.displacedCandidatesCount, 0, 'Candidate must not be displaced');
      assert.strictEqual(repairResult.displacedFacultyCount, 1);
      assert.strictEqual(repairResult.totalShiftMinutes, 0);

      const repaired = repairResult.repairedSchedule[0];
      assert.strictEqual(repaired.startTime, '09:00', 'Original start time preserved');
      assert.strictEqual(repaired.endTime, '09:45', 'Original end time preserved');
      assert.strictEqual(repaired.roomId, 'rm-101', 'Original chamber preserved');
      assert.deepStrictEqual(repaired.interviewerIds, ['int-02'], 'Assigned Priya Nair as substitute');
    });

    it('1.2 should match required technical skills when selecting substitute faculty', () => {
      // Interview requires Rust. int-02 has Rust, but int-03 does not!
      const activeSchedule = [
        {
          id: 'intv-rust',
          candidateId: 'cand-02',
          requiredSkills: ['Rust'],
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      const repairResult = DynamicRepairEngine.handleInterviewerCallout({
        schedule: activeSchedule,
        interviewerId: 'int-01',
        date: '2026-11-02',
        context: {
          interviewers: interviewersFixture,
          rooms: roomsFixture,
          candidates: candidatesFixture
        }
      });

      assert.strictEqual(repairResult.success, true);
      const repaired = repairResult.repairedSchedule[0];
      assert.deepStrictEqual(repaired.interviewerIds, ['int-02'], 'Selected int-02 who has Rust skill');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Faculty Call-Out / Slot Shift (Tier 2: Minimal Candidate Displacement)
  // ---------------------------------------------------------------------------
  describe('2. Faculty Call-Out / Slot Shift', () => {

    it('2.1 should shift session to closest available slot when no substitute is free in current slot', () => {
      // Both int-01 and int-02 are booked at 09:00!
      // If int-01 calls out, int-02 is busy at 09:00, so session must shift to 10:00 (next slot)
      const activeSchedule = [
        {
          id: 'intv-01',
          candidateId: 'cand-01',
          requiredSkills: ['Distributed Systems', 'Go'],
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        },
        {
          id: 'intv-02',
          candidateId: 'cand-02',
          requiredSkills: ['Distributed Systems', 'Go'],
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-02'], // int-02 is already booked at 09:00!
          roomId: 'rm-102'
        }
      ];

      const repairResult = DynamicRepairEngine.handleInterviewerCallout({
        schedule: activeSchedule,
        interviewerId: 'int-01',
        date: '2026-11-02',
        context: {
          interviewers: interviewersFixture,
          rooms: roomsFixture,
          candidates: candidatesFixture
        },
        options: { allowSlotShift: true }
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.affectedCount, 1);
      assert.strictEqual(repairResult.repairedCount, 1);
      assert.strictEqual(repairResult.displacedCandidatesCount, 1);

      const repairedIntv01 = repairResult.repairedSchedule.find(a => a.id === 'intv-01');
      assert.ok(repairedIntv01.startTime >= '10:00', `Expected shifted start time >= 10:00, got ${repairedIntv01.startTime}`);
      assert.deepStrictEqual(repairedIntv01.interviewerIds, ['int-02']);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Chamber Outage / Emergency Maintenance
  // ---------------------------------------------------------------------------
  describe('3. Chamber Outage / Emergency Maintenance', () => {

    it('3.1 should migrate sessions from offline chamber to available chamber with zero time shift', () => {
      // rm-101 is booked at 09:00. rm-102 is idle!
      const activeSchedule = [
        {
          id: 'intv-rm',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-01'],
          roomId: 'rm-101',
          roomName: 'Chamber Alpha'
        }
      ];

      const repairResult = DynamicRepairEngine.handleRoomOutage({
        schedule: activeSchedule,
        roomId: 'rm-101',
        date: '2026-11-02',
        context: {
          rooms: roomsFixture,
          interviewers: interviewersFixture,
          candidates: candidatesFixture
        }
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.affectedCount, 1);
      assert.strictEqual(repairResult.repairedCount, 1);

      const repaired = repairResult.repairedSchedule[0];
      assert.strictEqual(repaired.startTime, '09:00', 'Start time preserved');
      assert.strictEqual(repaired.endTime, '09:45', 'End time preserved');
      assert.deepStrictEqual(repaired.interviewerIds, ['int-01'], 'Faculty preserved');
      assert.strictEqual(repaired.roomId, 'rm-102', 'Migrated to Chamber Beta');
    });

    it('3.2 should respect equipment requirements when migrating chambers', () => {
      // Session requires AV Display. rm-101 (offline) has it, rm-102 does NOT, rm-103 has it!
      const activeSchedule = [
        {
          id: 'intv-av',
          candidateId: 'cand-01',
          requiredEquipment: ['AV Display'],
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      const repairResult = DynamicRepairEngine.handleRoomOutage({
        schedule: activeSchedule,
        roomId: 'rm-101',
        date: '2026-11-02',
        context: {
          rooms: roomsFixture,
          interviewers: interviewersFixture,
          candidates: candidatesFixture
        }
      });

      assert.strictEqual(repairResult.success, true);
      const repaired = repairResult.repairedSchedule[0];
      assert.strictEqual(repaired.roomId, 'rm-103', 'Migrated to rm-103 which possesses AV Display');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Candidate Reschedule Request
  // ---------------------------------------------------------------------------
  describe('4. Candidate Reschedule Request', () => {

    it('4.1 should reschedule candidate to preferred window while keeping all other bookings locked', () => {
      const activeSchedule = [
        {
          id: 'intv-01',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101'
        },
        {
          id: 'intv-02',
          candidateId: 'cand-02', // Locked booking
          candidateName: 'Dev Joshi',
          date: '2026-11-02',
          startTime: '10:00',
          endTime: '10:45',
          durationMinutes: 45,
          interviewerIds: ['int-02'],
          interviewerNames: ['Priya Nair'],
          roomId: 'rm-101'
        }
      ];

      // cand-01 requests to reschedule to afternoon at 14:00
      const repairResult = DynamicRepairEngine.rescheduleCandidate({
        schedule: activeSchedule,
        candidateId: 'cand-01',
        preferredWindow: {
          date: '2026-11-02',
          preferredStartTime: '14:00'
        },
        context: {
          interviewers: interviewersFixture,
          rooms: roomsFixture,
          candidates: candidatesFixture
        }
      });

      assert.strictEqual(repairResult.success, true);

      // Verify cand-02 was NOT disturbed
      const cand02Booking = repairResult.repairedSchedule.find(a => a.candidateId === 'cand-02');
      assert.strictEqual(cand02Booking.startTime, '10:00');
      assert.strictEqual(cand02Booking.endTime, '10:45');
      assert.strictEqual(cand02Booking.roomId, 'rm-101');

      // Verify cand-01 was rescheduled to 14:00
      const cand01Booking = repairResult.repairedSchedule.find(a => a.candidateId === 'cand-01');
      assert.strictEqual(cand01Booking.date, '2026-11-02');
      assert.strictEqual(cand01Booking.startTime, '14:00');
      assert.strictEqual(cand01Booking.endTime, '14:45');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Hard-Constraint Validation & Telemetry
  // ---------------------------------------------------------------------------
  describe('5. Hard-Constraint Validation & Telemetry', () => {

    it('5.1 should guarantee 0 violations across all repaired schedules via Stage 3 validator', () => {
      // Solve a full drive
      const initialSolution = CspSolver.solveDrive({
        driveId: 'drv-repair-test',
        roundName: 'Technical Screen',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: candidatesFixture,
        interviewers: interviewersFixture,
        rooms: roomsFixture
      });

      assert.strictEqual(initialSolution.isComplete, true);

      // Simulate faculty callout on the live schedule
      const repairResult = DynamicRepairEngine.handleInterviewerCallout({
        schedule: initialSolution.assignments,
        interviewerId: 'int-01',
        date: '2026-11-02',
        context: {
          interviewers: interviewersFixture,
          rooms: roomsFixture,
          candidates: candidatesFixture
        }
      });

      assert.strictEqual(repairResult.success, true);

      // Validate entire repaired schedule
      const validation = validateScheduleBatch(repairResult.repairedSchedule, {
        interviewers: interviewersFixture,
        rooms: roomsFixture,
        candidates: candidatesFixture
      });

      assert.ok(validation.every(v => v.valid), 'Repaired schedule must strictly satisfy all Stage 3 hard constraints');
    });
  });
});
