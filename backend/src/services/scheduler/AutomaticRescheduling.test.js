import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  DynamicRepairEngine,
  SchedulePersistenceService,
  InMemoryTransactionalPool,
  validateScheduleBatch,
  CspSolver
} from './index.js';

describe('Stage 8: Automatic Rescheduling & Dynamic Repair Pipeline', () => {

  const getInitialDriveData = () => ({
    drives: [
      {
        id: 'drv-101',
        name: 'Fall 2026 Systems Drive',
        status: 'Active',
        total_scheduled: 0
      }
    ],
    candidates: [
      {
        id: 'cand-01',
        name: 'Aanya Shah',
        applied_role: 'Senior Systems Engineer',
        drive_id: 'drv-101',
        status: 'Active',
        scheduled_time: null,
        room: null,
        interviewer: null
      },
      {
        id: 'cand-02',
        name: 'Dev Joshi',
        applied_role: 'Distributed Systems Architect',
        drive_id: 'drv-101',
        status: 'Active',
        scheduled_time: null,
        room: null,
        interviewer: null
      },
      {
        id: 'cand-03',
        name: 'Rohan Mehta',
        applied_role: 'Site Reliability Engineer',
        drive_id: 'drv-101',
        status: 'Active',
        scheduled_time: null,
        room: null,
        interviewer: null
      }
    ],
    interviewers: [
      {
        id: 'int-01',
        name: 'Dr. Evelyn Voss',
        skills: ['Distributed Systems', 'Go', 'Rust'],
        status: 'Available',
        max_interviews_per_day: 4,
        assigned_interviews: 0,
        bufferMinutes: 15,
        weekly_availability: {
          Monday: ['09:00', '10:00', '11:00', '14:00', '15:00']
        }
      },
      {
        id: 'int-02',
        name: 'Priya Nair',
        skills: ['Distributed Systems', 'Go', 'Rust'],
        status: 'Available',
        max_interviews_per_day: 4,
        assigned_interviews: 0,
        bufferMinutes: 15,
        weekly_availability: {
          Monday: ['09:00', '10:00', '11:00', '14:00', '15:00']
        }
      },
      {
        id: 'int-03',
        name: 'Marcus Sterling',
        skills: ['Distributed Systems', 'Go', 'Architecture'],
        status: 'Available',
        max_interviews_per_day: 4,
        assigned_interviews: 0,
        bufferMinutes: 15,
        weekly_availability: {
          Monday: ['09:00', '10:00', '11:00', '14:00', '15:00']
        }
      }
    ],
    rooms: [
      { id: 'rm-101', name: 'Chamber Alpha', capacity: 4, status: 'Available', equipment: ['Whiteboard', 'AV Display'] },
      { id: 'rm-102', name: 'Chamber Beta', capacity: 4, status: 'Available', equipment: ['Whiteboard', 'AV Display'] },
      { id: 'rm-103', name: 'Chamber Gamma', capacity: 6, status: 'Available', equipment: ['Whiteboard', 'AV Display'] }
    ],
    interviews: [],
    notifications: []
  });

  let mockPool;
  let context;

  beforeEach(() => {
    const data = getInitialDriveData();
    mockPool = new InMemoryTransactionalPool(data);
    context = {
      candidates: data.candidates,
      interviewers: data.interviewers,
      rooms: data.rooms
    };
  });

  // ---------------------------------------------------------------------------
  // 1. Automatic Faculty Call-Out & Live DB Rescheduling
  // ---------------------------------------------------------------------------
  describe('1. Faculty Emergency Call-Out with Live DB Persistence', () => {

    it('1.1 should substitute unavailable faculty and atomically update database records without moving candidate time', async () => {
      // Step 1: Commit initial schedule where int-01 interviews cand-01 and int-02 interviews cand-02
      const initialSchedule = [
        {
          id: 'intv-01',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          roundType: 'System Architecture',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          duration: '45 min',
          durationMinutes: 45,
          requiredSkills: ['Distributed Systems', 'Go'],
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101',
          roomName: 'Chamber Alpha',
          status: 'Scheduled'
        },
        {
          id: 'intv-02',
          candidateId: 'cand-02',
          candidateName: 'Dev Joshi',
          roundType: 'System Architecture',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          duration: '45 min',
          durationMinutes: 45,
          requiredSkills: ['Distributed Systems', 'Rust'],
          interviewerIds: ['int-02'],
          interviewerNames: ['Priya Nair'],
          roomId: 'rm-102',
          roomName: 'Chamber Beta',
          status: 'Scheduled'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: initialSchedule,
        poolOverride: mockPool
      });

      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-01').assigned_interviews, 1);
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-03').assigned_interviews, 0);

      // Step 2: Faculty int-01 calls out for 2026-11-02
      const repairResult = DynamicRepairEngine.repairFacultyCallOut({
        schedule: mockPool.tables.interviews.map(i => ({
          id: i.id,
          candidateId: i.candidate_id,
          candidateName: i.candidate_name,
          date: i.date,
          startTime: i.start_time,
          endTime: i.end_time,
          duration: i.duration,
          durationMinutes: 45,
          requiredSkills: ['Distributed Systems', 'Go'],
          interviewerIds: JSON.parse(i.interviewer_ids),
          interviewerNames: JSON.parse(i.interviewer_names),
          roomId: i.room_id,
          roomName: i.room_name
        })),
        unavailableInterviewerId: 'int-01',
        date: '2026-11-02',
        context
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.actions.length, 1);
      assert.strictEqual(repairResult.actions[0].actionType, 'SUBSTITUTE_FACULTY');
      assert.strictEqual(repairResult.actions[0].newInterviewerId, 'int-03'); // Marcus Sterling substituted
      assert.strictEqual(repairResult.actions[0].shiftMinutes, 0); // Zero candidate time displacement!

      // Step 3: Transactionally apply the repaired schedule to database
      const persistResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: repairResult.schedule,
        options: { replaceExistingForDrive: true },
        poolOverride: mockPool
      });

      assert.strictEqual(persistResult.success, true);

      // Verify database reflects the new substitute assessor
      const intv1 = mockPool.tables.interviews.find(i => i.id === 'intv-01');
      assert.ok(JSON.parse(intv1.interviewer_ids).includes('int-03'));
      assert.ok(!JSON.parse(intv1.interviewer_ids).includes('int-01'));

      // Verify candidate record updated with substitute interviewer name
      const cand1 = mockPool.tables.candidates.find(c => c.id === 'cand-01');
      assert.strictEqual(cand1.interviewer, 'Marcus Sterling');
      assert.strictEqual(cand1.scheduled_time, '2026-11-02 09:00 - 09:45'); // Time untouched!

      // Verify int-01 workload was decremented and int-03 was incremented
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-01').assigned_interviews, 0);
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-03').assigned_interviews, 1);
    });

    it('1.2 should shift time slot when no substitute is free in current slot', async () => {
      // Both int-02 and int-03 are busy at 09:00. int-01 calls out.
      const busySchedule = [
        {
          id: 'intv-01',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          requiredSkills: ['Distributed Systems', 'Go'],
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101'
        },
        {
          id: 'intv-02',
          candidateId: 'cand-02',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          requiredSkills: ['Distributed Systems', 'Go'],
          interviewerIds: ['int-02'],
          roomId: 'rm-102'
        },
        {
          id: 'intv-03',
          candidateId: 'cand-03',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          requiredSkills: ['Distributed Systems', 'Go'],
          interviewerIds: ['int-03'],
          roomId: 'rm-103'
        }
      ];

      const repairResult = DynamicRepairEngine.repairFacultyCallOut({
        schedule: busySchedule,
        unavailableInterviewerId: 'int-01',
        date: '2026-11-02',
        context
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.actions[0].actionType, 'SHIFT_TIME_SLOT');
      assert.strictEqual(repairResult.actions[0].newTime, '10:00-10:45'); // Shifted to closest slot
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Chamber Outage & Emergency Migration
  // ---------------------------------------------------------------------------
  describe('2. Chamber Outage & Emergency Migration', () => {

    it('2.1 should migrate sessions from offline chamber to available chamber with zero time shift', async () => {
      const schedule = [
        {
          id: 'intv-10',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101', // Chamber Alpha
          roomName: 'Chamber Alpha'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: schedule,
        poolOverride: mockPool
      });

      // Chamber Alpha goes offline for maintenance
      const repairResult = DynamicRepairEngine.repairChamberOutage({
        schedule,
        offlineRoomId: 'rm-101',
        date: '2026-11-02',
        context
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.actions.length, 1);
      assert.strictEqual(repairResult.actions[0].actionType, 'REASSIGN_CHAMBER');
      assert.notStrictEqual(repairResult.actions[0].newRoomId, 'rm-101'); // Migrated to alternate room

      // Persist the migrated schedule
      const persistResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: repairResult.schedule,
        options: { replaceExistingForDrive: true },
        poolOverride: mockPool
      });

      assert.strictEqual(persistResult.success, true);
      const intv = mockPool.tables.interviews.find(i => i.id === 'intv-10');
      assert.notStrictEqual(intv.room_id, 'rm-101');
      assert.strictEqual(intv.start_time, '09:00'); // Time untouched!
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Candidate Self-Reschedule Request
  // ---------------------------------------------------------------------------
  describe('3. Candidate Self-Reschedule Request', () => {

    it('3.1 should move candidate to requested window while keeping other bookings locked', async () => {
      const schedule = [
        {
          id: 'intv-a',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101'
        },
        {
          id: 'intv-b',
          candidateId: 'cand-02',
          candidateName: 'Dev Joshi',
          date: '2026-11-02',
          startTime: '10:00',
          endTime: '10:45',
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: schedule,
        poolOverride: mockPool
      });

      // Candidate 01 requests reschedule to afternoon (14:00)
      const repairResult = DynamicRepairEngine.rescheduleCandidate({
        schedule,
        candidateId: 'cand-01',
        preferredWindow: {
          preferredStartTime: '14:00'
        },
        context
      });

      assert.strictEqual(repairResult.success, true);
      assert.strictEqual(repairResult.actions[0].actionType, 'RESCHEDULE_CANDIDATE');
      assert.strictEqual(repairResult.actions[0].newTime, '14:00-14:45');

      // Candidate 02 booking was untouched
      const cand02Session = repairResult.schedule.find(s => s.candidateId === 'cand-02');
      assert.strictEqual(cand02Session.startTime, '10:00');
      assert.strictEqual(cand02Session.endTime, '10:45');

      // Apply to DB
      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: repairResult.schedule,
        options: { replaceExistingForDrive: true },
        poolOverride: mockPool
      });

      const cand1 = mockPool.tables.candidates.find(c => c.id === 'cand-01');
      assert.strictEqual(cand1.scheduled_time, '2026-11-02 14:00 - 14:45');
    });

    it('3.2 should throw error when candidate has no scheduled interview', () => {
      assert.throws(
        () => {
          DynamicRepairEngine.rescheduleCandidate({
            schedule: [],
            candidateId: 'cand-non-existent',
            context
          });
        },
        /has no scheduled interview/
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Concurrency & Constraint Safety Guarantee
  // ---------------------------------------------------------------------------
  describe('4. Hard-Constraint Preservation Guarantee', () => {

    it('4.1 should guarantee 0 hard-constraint violations across all automatically repaired schedules', async () => {
      // Create initial 3-candidate schedule via CSP
      const cspResult = CspSolver.solveDrive({
        driveId: 'drv-101',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates: context.candidates,
        interviewers: context.interviewers,
        rooms: context.rooms
      });

      assert.strictEqual(cspResult.success, true);
      assert.strictEqual(cspResult.assignments.length, 3);

      // Perform a faculty callout repair
      const repaired = DynamicRepairEngine.repairFacultyCallOut({
        schedule: cspResult.assignments,
        unavailableInterviewerId: cspResult.assignments[0].interviewerIds[0],
        date: '2026-11-02',
        context
      });

      assert.strictEqual(repaired.success, true);

      // Validate repaired batch via Stage 3 validator
      const validationResults = validateScheduleBatch(repaired.schedule, context);
      assert.strictEqual(validationResults.every(r => r.valid), true);
      assert.strictEqual(validationResults.flatMap(r => r.violations).length, 0);
    });
  });
});
