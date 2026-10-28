import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  SchedulePersistenceService,
  InMemoryTransactionalPool,
  CspSolver,
  validateScheduleBatch
} from './index.js';

describe('Stage 7: Backend Integration & Safe Persistence Service', () => {

  // Seed fixtures for in-memory transactional database
  const getInitialData = () => ({
    drives: [
      {
        id: 'drv-101',
        name: 'Fall 2026 Systems Engineering Drive',
        status: 'Active',
        total_scheduled: 0
      }
    ],
    candidates: [
      {
        id: 'cand-01',
        name: 'Aanya Shah',
        email: 'aanya.shah@example.com',
        applied_role: 'Senior Systems Engineer',
        drive_id: 'drv-101',
        status: 'Active',
        scheduled_time: null,
        room: null,
        interviewer: null,
        stage: 'Technical'
      },
      {
        id: 'cand-02',
        name: 'Dev Joshi',
        email: 'dev.joshi@example.com',
        applied_role: 'Distributed Systems Architect',
        drive_id: 'drv-101',
        status: 'Active',
        scheduled_time: null,
        room: null,
        interviewer: null,
        stage: 'Technical'
      },
      {
        id: 'cand-03',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
        applied_role: 'Site Reliability Engineer',
        drive_id: 'drv-101',
        status: 'Active',
        scheduled_time: null,
        room: null,
        interviewer: null,
        stage: 'Technical'
      }
    ],
    interviewers: [
      {
        id: 'int-01',
        name: 'Dr. Evelyn Voss',
        max_interviews_per_day: 4,
        assigned_interviews: 0,
        status: 'Available'
      },
      {
        id: 'int-02',
        name: 'Priya Nair',
        max_interviews_per_day: 4,
        assigned_interviews: 0,
        status: 'Available'
      }
    ],
    rooms: [
      { id: 'rm-101', name: 'Chamber Alpha', capacity: 4, status: 'Available' },
      { id: 'rm-102', name: 'Chamber Beta', capacity: 4, status: 'Available' }
    ],
    interviews: [],
    notifications: []
  });

  let mockPool;

  beforeEach(() => {
    mockPool = new InMemoryTransactionalPool(getInitialData());
  });

  // ---------------------------------------------------------------------------
  // 1. Atomic Batch Persistence & State Synchronization
  // ---------------------------------------------------------------------------
  describe('1. Atomic Batch Persistence & State Synchronization', () => {

    it('1.1 should atomically commit multiple assignments and synchronize candidates, faculty, and drive', async () => {
      const assignments = [
        {
          id: 'intv-001',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          candidateRole: 'Senior Systems Engineer',
          roundType: 'System Architecture',
          roundTitle: 'System Architecture · Aanya Shah',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          duration: '45 min',
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101',
          roomName: 'Chamber Alpha',
          status: 'Scheduled'
        },
        {
          id: 'intv-002',
          candidateId: 'cand-02',
          candidateName: 'Dev Joshi',
          candidateRole: 'Distributed Systems Architect',
          roundType: 'System Architecture',
          roundTitle: 'System Architecture · Dev Joshi',
          date: '2026-11-02',
          startTime: '10:00',
          endTime: '10:45',
          duration: '45 min',
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101',
          roomName: 'Chamber Alpha',
          status: 'Scheduled'
        },
        {
          id: 'intv-003',
          candidateId: 'cand-03',
          candidateName: 'Rohan Mehta',
          candidateRole: 'Site Reliability Engineer',
          roundType: 'System Architecture',
          roundTitle: 'System Architecture · Rohan Mehta',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          duration: '45 min',
          interviewerIds: ['int-02'],
          interviewerNames: ['Priya Nair'],
          roomId: 'rm-102',
          roomName: 'Chamber Beta',
          status: 'Scheduled'
        }
      ];

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments,
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.appliedCount, 3);
      assert.strictEqual(result.interviewIds.length, 3);

      // Verify interviews inserted
      assert.strictEqual(mockPool.tables.interviews.length, 3);
      const intv1 = mockPool.tables.interviews.find(i => i.id === 'intv-001');
      assert.strictEqual(intv1.candidate_id, 'cand-01');
      assert.strictEqual(intv1.start_time, '09:00');
      assert.strictEqual(intv1.status, 'Scheduled');

      // Verify candidate records updated
      const cand1 = mockPool.tables.candidates.find(c => c.id === 'cand-01');
      assert.strictEqual(cand1.status, 'Scheduled');
      assert.strictEqual(cand1.scheduled_time, '2026-11-02 09:00 - 09:45');
      assert.strictEqual(cand1.room, 'Chamber Alpha');
      assert.strictEqual(cand1.interviewer, 'Dr. Evelyn Voss');

      const cand3 = mockPool.tables.candidates.find(c => c.id === 'cand-03');
      assert.strictEqual(cand3.status, 'Scheduled');
      assert.strictEqual(cand3.room, 'Chamber Beta');
      assert.strictEqual(cand3.interviewer, 'Priya Nair');

      // Verify faculty workload counters updated
      const int1 = mockPool.tables.interviewers.find(i => i.id === 'int-01');
      const int2 = mockPool.tables.interviewers.find(i => i.id === 'int-02');
      assert.strictEqual(int1.assigned_interviews, 2); // 2 sessions assigned
      assert.strictEqual(int2.assigned_interviews, 1); // 1 session assigned

      // Verify drive metrics updated
      const drive = mockPool.tables.drives.find(d => d.id === 'drv-101');
      assert.strictEqual(drive.total_scheduled, 3);
      assert.strictEqual(drive.status, 'Active');

      // Verify audit notification generated
      assert.strictEqual(mockPool.tables.notifications.length, 1);
      assert.strictEqual(mockPool.tables.notifications[0].type, 'success');
      assert.ok(mockPool.tables.notifications[0].message.includes('3 interview sessions'));
    });

    it('1.2 should safely handle empty assignment list without error', async () => {
      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: [],
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.appliedCount, 0);
      assert.strictEqual(mockPool.tables.interviews.length, 0);
    });

    it('1.3 should throw error if driveId is not provided', async () => {
      await assert.rejects(
        async () => {
          await SchedulePersistenceService.applyScheduleTransaction({
            assignments: [{ id: 'intv-1' }],
            poolOverride: mockPool
          });
        },
        /driveId is required/
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Pre-Commit Concurrency & Collision Checks
  // ---------------------------------------------------------------------------
  describe('2. Pre-Commit Concurrency & Collision Checks', () => {

    it('2.1 should detect and reject candidate double-booking with existing database booking', async () => {
      // Pre-seed an existing committed interview in the database
      mockPool.tables.interviews.push({
        id: 'existing-intv-99',
        candidate_id: 'cand-01',
        interviewer_ids: JSON.stringify(['int-02']),
        room_id: 'rm-102',
        date: '2026-11-02',
        start_time: '09:00',
        end_time: '09:45',
        status: 'Scheduled'
      });

      // Proposed schedule tries to book candidate cand-01 at the same time in rm-101 with int-01
      const proposed = [
        {
          id: 'new-intv-1',
          candidateId: 'cand-01',
          candidateName: 'Aanya Shah',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          interviewerNames: ['Dr. Evelyn Voss'],
          roomId: 'rm-101',
          roomName: 'Chamber Alpha'
        }
      ];

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: proposed,
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.rolledBack, true);
      assert.strictEqual(result.reason, 'CONCURRENCY_COLLISION');
      assert.strictEqual(result.collisions.length, 1);
      assert.strictEqual(result.collisions[0].type, 'CANDIDATE_DOUBLE_BOOKING');
      assert.strictEqual(result.collisions[0].candidateId, 'cand-01');

      // Verify no changes committed
      assert.strictEqual(mockPool.tables.interviews.length, 1); // Only pre-seeded interview
      const cand1 = mockPool.tables.candidates.find(c => c.id === 'cand-01');
      assert.strictEqual(cand1.status, 'Active'); // Remained Active
    });

    it('2.2 should detect and reject room double-booking with existing database booking', async () => {
      // Room rm-101 is already booked 09:00-09:45
      mockPool.tables.interviews.push({
        id: 'existing-intv-88',
        candidate_id: 'cand-02',
        interviewer_ids: JSON.stringify(['int-02']),
        room_id: 'rm-101',
        date: '2026-11-02',
        start_time: '09:00',
        end_time: '09:45',
        status: 'Scheduled'
      });

      // Proposed schedule tries to book room rm-101 for cand-01 at 09:00-09:45
      const proposed = [
        {
          id: 'new-intv-2',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: proposed,
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'CONCURRENCY_COLLISION');
      assert.strictEqual(result.collisions[0].type, 'ROOM_DOUBLE_BOOKING');
      assert.strictEqual(result.collisions[0].roomId, 'rm-101');
    });

    it('2.3 should detect and reject interviewer double-booking with existing database booking', async () => {
      // Interviewer int-01 is already booked in another session 09:00-09:45
      mockPool.tables.interviews.push({
        id: 'existing-intv-77',
        candidate_id: 'cand-02',
        interviewer_ids: JSON.stringify(['int-01']),
        room_id: 'rm-102',
        date: '2026-11-02',
        start_time: '09:00',
        end_time: '09:45',
        status: 'Scheduled'
      });

      // Proposed schedule tries to book int-01 at 09:00-09:45
      const proposed = [
        {
          id: 'new-intv-3',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: proposed,
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'CONCURRENCY_COLLISION');
      assert.strictEqual(result.collisions[0].type, 'INTERVIEWER_DOUBLE_BOOKING');
      assert.ok(result.collisions[0].interviewerIds.includes('int-01'));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Atomic Rollback on Failure (All-or-Nothing Guarantee)
  // ---------------------------------------------------------------------------
  describe('3. Atomic Rollback on Failure (All-or-Nothing Guarantee)', () => {

    it('3.1 should execute complete ROLLBACK and restore initial database state when query fails', async () => {
      const assignments = [
        {
          id: 'intv-fail-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      // Simulate a database failure / connection drop
      mockPool.setFailOnNextQuery(true);

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments,
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.rolledBack, true);
      assert.strictEqual(result.reason, 'TRANSACTION_ERROR');

      // Verify zero dirty reads or partial writes in database tables
      assert.strictEqual(mockPool.tables.interviews.length, 0);
      assert.strictEqual(mockPool.tables.candidates.find(c => c.id === 'cand-01').status, 'Active');
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-01').assigned_interviews, 0);
      assert.strictEqual(mockPool.tables.drives.find(d => d.id === 'drv-101').total_scheduled, 0);
    });

    it('3.2 should reject internally invalid batches via Stage 3 validator before database transaction', async () => {
      // Two candidates booked into same room at exact same time in the submitted batch
      const invalidBatch = [
        {
          id: 'intv-coll-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        },
        {
          id: 'intv-coll-2',
          candidateId: 'cand-02',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-02'],
          roomId: 'rm-101' // Room collision within batch!
        }
      ];

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: invalidBatch,
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.rolledBack, true);
      assert.strictEqual(result.reason, 'INTERNAL_VALIDATION_FAILED');
      assert.strictEqual(mockPool.tables.interviews.length, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Schedule Rollback & Administrative Reset
  // ---------------------------------------------------------------------------
  describe('4. Schedule Rollback & Administrative Reset', () => {

    it('4.1 should rollback an applied schedule, reverting candidate statuses and decrementing faculty counters', async () => {
      // Step 1: Apply initial schedule
      const assignments = [
        {
          id: 'intv-rb-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        },
        {
          id: 'intv-rb-2',
          candidateId: 'cand-02',
          date: '2026-11-02',
          startTime: '10:00',
          endTime: '10:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments,
        poolOverride: mockPool
      });

      assert.strictEqual(mockPool.tables.interviews.length, 2);
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-01').assigned_interviews, 2);

      // Step 2: Rollback the schedule
      const rollbackResult = await SchedulePersistenceService.rollbackSchedule({
        driveId: 'drv-101',
        reason: 'Recruiter rescheduled drive dates',
        poolOverride: mockPool
      });

      assert.strictEqual(rollbackResult.success, true);
      assert.strictEqual(rollbackResult.rolledBackCount, 2);

      // Verify candidates reverted to Active
      const cand1 = mockPool.tables.candidates.find(c => c.id === 'cand-01');
      const cand2 = mockPool.tables.candidates.find(c => c.id === 'cand-02');
      assert.strictEqual(cand1.status, 'Active');
      assert.strictEqual(cand1.scheduled_time, null);
      assert.strictEqual(cand2.status, 'Active');

      // Verify faculty workload counter decremented
      const int1 = mockPool.tables.interviewers.find(i => i.id === 'int-01');
      assert.strictEqual(int1.assigned_interviews, 0);

      // Verify drive metrics decremented
      const drive = mockPool.tables.drives.find(d => d.id === 'drv-101');
      assert.strictEqual(drive.total_scheduled, 0);

      // Verify interviews marked Cancelled
      const intv1 = mockPool.tables.interviews.find(i => i.id === 'intv-rb-1');
      assert.strictEqual(intv1.status, 'Cancelled');
      assert.ok(intv1.notes.includes('Recruiter rescheduled drive dates'));

      // Verify rollback notification
      const notif = mockPool.tables.notifications.find(n => n.type === 'warning');
      assert.ok(notif);
      assert.ok(notif.message.includes('Rolled back 2 sessions'));
    });

    it('4.2 should support hardDelete option to completely remove rows from interviews table', async () => {
      const assignments = [
        {
          id: 'intv-del-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments,
        poolOverride: mockPool
      });

      assert.strictEqual(mockPool.tables.interviews.length, 1);

      await SchedulePersistenceService.rollbackSchedule({
        driveId: 'drv-101',
        hardDelete: true,
        poolOverride: mockPool
      });

      assert.strictEqual(mockPool.tables.interviews.length, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Replace Existing Schedule for Drive
  // ---------------------------------------------------------------------------
  describe('5. Replace Existing Schedule for Drive', () => {

    it('5.1 should cleanly replace prior drive sessions without doubling faculty workload counters', async () => {
      // Initial schedule: cand-01 with int-01
      const initial = [
        {
          id: 'intv-old-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: initial,
        poolOverride: mockPool
      });

      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-01').assigned_interviews, 1);

      // New schedule replaces old schedule: cand-01 with int-02, and cand-02 with int-01
      const revised = [
        {
          id: 'intv-new-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-02'], // Swapped to int-02
          roomId: 'rm-102'
        },
        {
          id: 'intv-new-2',
          candidateId: 'cand-02',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      const result = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: revised,
        options: { replaceExistingForDrive: true },
        poolOverride: mockPool
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.appliedCount, 2);

      // Verify int-01 has 1 session (old decremented by 1, new incremented by 1)
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-01').assigned_interviews, 1);
      // Verify int-02 has 1 session
      assert.strictEqual(mockPool.tables.interviewers.find(i => i.id === 'int-02').assigned_interviews, 1);

      // Verify drive total_scheduled is exactly 2
      assert.strictEqual(mockPool.tables.drives.find(d => d.id === 'drv-101').total_scheduled, 2);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Schedule Status & Metrics Telemetry
  // ---------------------------------------------------------------------------
  describe('6. Schedule Status & Metrics Telemetry', () => {

    it('6.1 should compute accurate fulfillment metrics and faculty utilization', async () => {
      const assignments = [
        {
          id: 'intv-st-1',
          candidateId: 'cand-01',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '09:45',
          interviewerIds: ['int-01'],
          roomId: 'rm-101'
        }
      ];

      await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments,
        poolOverride: mockPool
      });

      const status = await SchedulePersistenceService.getScheduleStatus({
        driveId: 'drv-101',
        poolOverride: mockPool
      });

      assert.strictEqual(status.success, true);
      assert.strictEqual(status.driveId, 'drv-101');
      assert.strictEqual(status.metrics.totalCandidates, 3);
      assert.strictEqual(status.metrics.scheduledCandidates, 1);
      assert.strictEqual(status.metrics.pendingCandidates, 2);
      assert.strictEqual(status.metrics.fulfillmentRate, '33%');
      assert.strictEqual(status.interviews.length, 1);
      assert.strictEqual(status.facultyUtilization.length, 2);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Full Integration: CspSolver -> SchedulePersistenceService
  // ---------------------------------------------------------------------------
  describe('7. Full Integration: CspSolver -> SchedulePersistenceService', () => {

    it('7.1 should solve a multi-candidate drive with CSP and safely persist 100% of assignments', async () => {
      const candidates = [
        { id: 'cand-01', name: 'Aanya Shah', skills: ['Distributed Systems', 'Go'] },
        { id: 'cand-02', name: 'Dev Joshi', skills: ['Distributed Systems', 'Rust'] }
      ];
      const interviewers = [
        {
          id: 'int-01',
          name: 'Dr. Evelyn Voss',
          skills: ['Distributed Systems', 'Go', 'Rust'],
          status: 'Available',
          maxInterviewsPerDay: 4,
          bufferMinutes: 15,
          weeklyAvailability: { Monday: ['09:00', '10:00', '11:00', '14:00'] }
        },
        {
          id: 'int-02',
          name: 'Priya Nair',
          skills: ['Distributed Systems', 'Go', 'Rust'],
          status: 'Available',
          maxInterviewsPerDay: 4,
          bufferMinutes: 15,
          weeklyAvailability: { Monday: ['09:00', '10:00', '11:00', '14:00'] }
        }
      ];
      const rooms = [
        { id: 'rm-101', name: 'Chamber Alpha', capacity: 4, status: 'Available' },
        { id: 'rm-102', name: 'Chamber Beta', capacity: 4, status: 'Available' }
      ];

      // Solve via CSP
      const solverResult = CspSolver.solveDrive({
        driveId: 'drv-101',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        durationMinutes: 45,
        bufferMinutes: 15,
        candidates,
        interviewers,
        rooms
      });

      assert.strictEqual(solverResult.success, true);
      assert.strictEqual(solverResult.isComplete, true);
      assert.strictEqual(solverResult.assignments.length, 2);

      // Safely persist via Stage 7
      const persistResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId: 'drv-101',
        assignments: solverResult.assignments,
        poolOverride: mockPool
      });

      assert.strictEqual(persistResult.success, true);
      assert.strictEqual(persistResult.appliedCount, 2);
      assert.strictEqual(mockPool.tables.interviews.length, 2);

      // Verify that committed database batch passes all Stage 3 hard constraints
      const batchValidation = validateScheduleBatch(mockPool.tables.interviews.map(i => ({
        id: i.id,
        candidateId: i.candidate_id,
        date: i.date,
        startTime: i.start_time,
        endTime: i.end_time,
        roomId: i.room_id,
        interviewerIds: JSON.parse(i.interviewer_ids)
      })));
      assert.strictEqual(batchValidation.every(v => v.valid), true);
      const allViolations = batchValidation.flatMap(v => v.violations);
      assert.strictEqual(allViolations.length, 0);
    });
  });
});
