import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  VIOLATION_CODES,
  validateAssignment,
  validateScheduleBatch,
  validateIntervalTiming,
  validateCandidateConstraints,
  validateInterviewerConstraints,
  validateRoomConstraints,
  validatePanelComposition,
  validateLockedBookingProtection,
  validateTimezoneConfig
} from './ConstraintValidator.js';

describe('Stage 3: Hard-Constraint Validator Tests', () => {

  // Fixtures
  const validCandidate = {
    id: 'cand-01',
    name: 'Aanya Shah',
    appliedRole: 'Software Development Engineer',
    skills: ['Distributed Systems', 'Go', 'System Design']
  };

  const validInterviewer = {
    id: 'int-01',
    name: 'Dr. Evelyn Voss',
    status: 'Available',
    maxInterviewsPerDay: 3,
    skills: ['Distributed Systems', 'Go', 'Rust'],
    weeklyAvailability: {
      Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      Tuesday: ['10:00', '11:00'],
      Wednesday: ['09:00', '10:00', '11:00']
    }
  };

  const validRoom = {
    id: 'room-01',
    name: 'Chamber Alpha (Hybrid Nexus)',
    capacity: 6,
    type: 'Hybrid Physical',
    equipment: ['4K Ultra HD Display', 'Dual Glass Whiteboards'],
    status: 'Available'
  };

  const defaultContext = {
    candidates: [validCandidate],
    interviewers: [validInterviewer],
    rooms: [validRoom],
    existingInterviews: [],
    operatingHours: { startTime: '09:00', endTime: '18:00' },
    timezone: 'Asia/Kolkata',
    interviewerBufferMinutes: 15
  };

  // =========================================================================
  // 1. A VALID ASSIGNMENT
  // =========================================================================
  describe('1. Valid Assignment', () => {
    it('1.1 should satisfy all hard constraints for a completely valid proposed assignment', () => {
      const assignment = {
        id: 'prop-intv-101',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02', // Monday
        startTime: '10:00',
        endTime: '10:45',
        durationMinutes: 45,
        requiredSkills: ['Distributed Systems']
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, true, 'Assignment should be valid');
      assert.deepEqual(result.violations, [], 'Should have zero violations');
      assert.equal(result.evaluatedConstraintsCount > 0, true);
    });
  });

  // =========================================================================
  // 2. CANDIDATE DOUBLE-BOOKING
  // =========================================================================
  describe('2. Candidate Double-Booking', () => {
    it('2.1 should detect overlapping booking for the same candidate on the same date', () => {
      const contextWithCandidateBooking = {
        ...defaultContext,
        existingInterviews: [
          {
            id: 'intv-existing-1',
            candidateId: 'cand-01',
            date: '2026-11-02',
            startTime: '09:30',
            endTime: '10:15',
            status: 'Scheduled'
          }
        ]
      };

      const assignment = {
        id: 'prop-intv-102',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00', // Overlaps with 09:30-10:15
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, contextWithCandidateBooking);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.CANDIDATE_DOUBLE_BOOKED);
      assert.ok(violation, 'Must report CANDIDATE_DOUBLE_BOOKED');
      assert.equal(violation.resourceId, 'cand-01');
      assert.equal(violation.details.conflictingInterviewId, 'intv-existing-1');
    });
  });

  // =========================================================================
  // 3. INTERVIEWER DOUBLE-BOOKING
  // =========================================================================
  describe('3. Interviewer Double-Booking', () => {
    it('3.1 should detect overlapping interview for the same interviewer', () => {
      const contextWithInterviewerBooking = {
        ...defaultContext,
        existingInterviews: [
          {
            id: 'intv-existing-2',
            candidateId: 'cand-other',
            interviewerIds: ['int-01'],
            date: '2026-11-02',
            startTime: '10:00',
            endTime: '10:45',
            status: 'Scheduled'
          }
        ]
      };

      const assignment = {
        id: 'prop-intv-103',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:30', // Overlaps 10:00-10:45
        endTime: '11:15'
      };

      const result = validateAssignment(assignment, contextWithInterviewerBooking);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INTERVIEWER_DOUBLE_BOOKED);
      assert.ok(violation, 'Must report INTERVIEWER_DOUBLE_BOOKED');
      assert.equal(violation.resourceId, 'int-01');
    });
  });

  // =========================================================================
  // 4. ROOM DOUBLE-BOOKING
  // =========================================================================
  describe('4. Room Double-Booking', () => {
    it('4.1 should detect overlapping booking for the same room on the same date', () => {
      const contextWithRoomBooking = {
        ...defaultContext,
        existingInterviews: [
          {
            id: 'intv-existing-3',
            roomId: 'room-01',
            date: '2026-11-02',
            startTime: '14:00',
            endTime: '14:45',
            status: 'Scheduled'
          }
        ]
      };

      const assignment = {
        id: 'prop-intv-104',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '14:15', // Overlaps 14:00-14:45
        endTime: '15:00'
      };

      const result = validateAssignment(assignment, contextWithRoomBooking);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.ROOM_DOUBLE_BOOKED);
      assert.ok(violation, 'Must report ROOM_DOUBLE_BOOKED');
      assert.equal(violation.resourceId, 'room-01');
    });
  });

  // =========================================================================
  // 5. ADJACENT INTERVIEWS (HALF-OPEN INTERVALS)
  // =========================================================================
  describe('5. Adjacent Interviews (Half-Open Intervals)', () => {
    it('5.1 should NOT report room or candidate overlap when interviews meet exactly at the boundary', () => {
      // Existing interview in room-01 ends at exactly 09:45 with different interviewer int-02
      const contextWithAdjacentRoom = {
        ...defaultContext,
        interviewers: [
          {
            ...validInterviewer,
            weeklyAvailability: {
              Monday: ['09:00', '09:45', '10:00', '11:00']
            }
          }
        ],
        existingInterviews: [
          {
            id: 'intv-existing-adj',
            candidateId: 'cand-other',
            interviewerIds: ['int-02'],
            roomId: 'room-01',
            date: '2026-11-02',
            startTime: '09:00',
            endTime: '09:45',
            status: 'Scheduled'
          }
        ]
      };

      // Proposed interview starts in room-01 at exactly 09:45 with interviewer int-01
      const assignment = {
        id: 'prop-intv-105',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '09:45',
        endTime: '10:30'
      };

      const result = validateAssignment(assignment, contextWithAdjacentRoom);

      assert.equal(result.valid, true, 'Adjacent meeting at boundary is not an overlap');
      assert.equal(result.violations.length, 0);
    });
  });

  // =========================================================================
  // 6. INTERVIEWER BUFFER VIOLATIONS
  // =========================================================================
  describe('6. Interviewer Buffer Violations', () => {
    it('6.1 should detect buffer violations for the SAME interviewer even when intervals do not directly overlap', () => {
      // Existing interview for int-01 ends at 09:45
      const contextWithBufferGap = {
        ...defaultContext,
        interviewerBufferMinutes: 15,
        existingInterviews: [
          {
            id: 'intv-int-prior',
            interviewerIds: ['int-01'],
            candidateId: 'cand-other',
            date: '2026-11-02',
            startTime: '09:00',
            endTime: '09:45',
            status: 'Scheduled'
          }
        ]
      };

      // Proposed interview for int-01 starts at 09:50 (gap is only 5 minutes < 15 min required)
      const assignment = {
        id: 'prop-intv-106',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '09:50',
        endTime: '10:35'
      };

      const result = validateAssignment(assignment, contextWithBufferGap);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INTERVIEWER_BUFFER_VIOLATION);
      assert.ok(violation, 'Must report INTERVIEWER_BUFFER_VIOLATION');
      assert.equal(violation.details.actualGapMinutes, 5);
      assert.equal(violation.details.requiredBufferMinutes, 15);
    });

    it('6.2 should PASS buffer check when the separation gap equals or exceeds the required buffer', () => {
      const contextWithBufferPass = {
        ...defaultContext,
        interviewerBufferMinutes: 15,
        existingInterviews: [
          {
            id: 'intv-int-prior',
            interviewerIds: ['int-01'],
            date: '2026-11-02',
            startTime: '09:00',
            endTime: '09:45',
            status: 'Scheduled'
          }
        ]
      };

      // Proposed interview starts at 10:00 (gap is exactly 15 minutes: 10:00 - 09:45)
      const assignment = {
        id: 'prop-intv-107',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, contextWithBufferPass);

      assert.equal(result.valid, true);
      assert.equal(result.violations.length, 0);
    });
  });

  // =========================================================================
  // 7. CANDIDATE AVAILABILITY VIOLATIONS
  // =========================================================================
  describe('7. Candidate Availability Violations', () => {
    it('7.1 should report CANDIDATE_UNAVAILABLE when proposed interval falls outside candidate availability windows', () => {
      const candidateWithWindows = {
        ...validCandidate,
        availabilityWindows: [
          { dayOfWeek: 'Monday', startTime: '14:00', endTime: '18:00' } // Only available in afternoon
        ]
      };

      const contextWithCandidateWindows = {
        ...defaultContext,
        candidates: [candidateWithWindows]
      };

      // Proposed assignment is in morning at 10:00-10:45
      const assignment = {
        id: 'prop-intv-108',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02', // Monday
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, contextWithCandidateWindows);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.CANDIDATE_UNAVAILABLE);
      assert.ok(violation, 'Must report CANDIDATE_UNAVAILABLE');
    });
  });

  // =========================================================================
  // 8. INTERVIEWER AVAILABILITY VIOLATIONS
  // =========================================================================
  describe('8. Interviewer Availability Violations', () => {
    it('8.1 should report INTERVIEWER_STATUS_UNAVAILABLE when interviewer is On Leave', () => {
      const onLeaveInterviewer = {
        ...validInterviewer,
        status: 'On Leave'
      };

      const context = {
        ...defaultContext,
        interviewers: [onLeaveInterviewer]
      };

      const assignment = {
        id: 'prop-intv-109',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, context);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INTERVIEWER_STATUS_UNAVAILABLE);
      assert.ok(violation, 'Must report INTERVIEWER_STATUS_UNAVAILABLE');
    });

    it('8.2 should report INTERVIEWER_WEEKLY_UNAVAILABLE when interviewer has no hours on that day', () => {
      const interviewerWithTuesdayOff = {
        ...validInterviewer,
        weeklyAvailability: {
          Monday: ['09:00', '10:00'],
          Tuesday: [] // No hours on Tuesday
        }
      };

      const context = {
        ...defaultContext,
        interviewers: [interviewerWithTuesdayOff]
      };

      const assignment = {
        id: 'prop-intv-110',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-03', // Tuesday
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, context);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INTERVIEWER_WEEKLY_UNAVAILABLE);
      assert.ok(violation, 'Must report INTERVIEWER_WEEKLY_UNAVAILABLE');
    });

    it('8.3 should report INTERVIEWER_DAILY_LIMIT_EXCEEDED when daily cap is reached', () => {
      const contextWithMaxLimitReached = {
        ...defaultContext,
        interviewers: [{ ...validInterviewer, maxInterviewsPerDay: 2 }],
        existingInterviews: [
          { id: 'intv-1', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '09:00', endTime: '09:45' },
          { id: 'intv-2', interviewerIds: ['int-01'], date: '2026-11-02', startTime: '11:00', endTime: '11:45' }
        ]
      };

      // Third interview attempt on the same date when max is 2
      const assignment = {
        id: 'prop-intv-111',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '14:00',
        endTime: '14:45'
      };

      const result = validateAssignment(assignment, contextWithMaxLimitReached);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INTERVIEWER_DAILY_LIMIT_EXCEEDED);
      assert.ok(violation, 'Must report INTERVIEWER_DAILY_LIMIT_EXCEEDED');
      assert.equal(violation.details.maxInterviewsPerDay, 2);
    });
  });

  // =========================================================================
  // 9. OPERATING HOURS & DURATION BOUNDARIES
  // =========================================================================
  describe('9. Operating Hours & Duration Boundaries', () => {
    it('9.1 should report OPERATING_HOURS_EXCEEDED when interview extends past operating end', () => {
      const assignment = {
        id: 'prop-intv-112',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '17:30',
        endTime: '18:15' // Extends past 18:00
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.OPERATING_HOURS_EXCEEDED);
      assert.ok(violation, 'Must report OPERATING_HOURS_EXCEEDED');
    });

    it('9.2 should report INVALID_DURATION when duration does not match expected round duration', () => {
      const assignment = {
        id: 'prop-intv-113',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45', // 45 min
        durationMinutes: 60 // Expected 60 min
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INVALID_DURATION);
      assert.ok(violation, 'Must report INVALID_DURATION');
      assert.equal(violation.details.actualDuration, 45);
      assert.equal(violation.details.expectedDuration, 60);
    });

    it('9.3 should report INVALID_TIME_INTERVAL when startTime is not strictly before endTime', () => {
      const assignment = {
        id: 'prop-intv-114',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '11:00',
        endTime: '10:30' // Inverted interval
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INVALID_TIME_INTERVAL);
      assert.ok(violation, 'Must report INVALID_TIME_INTERVAL');
    });
  });

  // =========================================================================
  // 10. REQUIRED INTERVIEWER SKILLS
  // =========================================================================
  describe('10. Required Interviewer Skills', () => {
    it('10.1 should report INTERVIEWER_SKILLS_DEFICIENT when panel lacks required technical skills', () => {
      const assignment = {
        id: 'prop-intv-115',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'], // int-01 has ['Distributed Systems', 'Go', 'Rust']
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45',
        requiredSkills: ['Distributed Systems', 'Kubernetes', 'GraphQL'] // Kubernetes & GraphQL missing
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.INTERVIEWER_SKILLS_DEFICIENT);
      assert.ok(violation, 'Must report INTERVIEWER_SKILLS_DEFICIENT');
      assert.deepEqual(violation.details.missingSkills, ['Kubernetes', 'GraphQL']);
    });
  });

  // =========================================================================
  // 11. ROOM CAPACITY, TYPE & EQUIPMENT VIOLATIONS
  // =========================================================================
  describe('11. Room Capacity, Type & Equipment', () => {
    it('11.1 should report ROOM_CAPACITY_EXCEEDED when room capacity is less than required', () => {
      const smallRoom = {
        id: 'room-small',
        name: 'Phone Booth 1',
        capacity: 2,
        status: 'Available'
      };

      const context = {
        ...defaultContext,
        rooms: [smallRoom]
      };

      // 2 interviewers + 1 candidate = 3 people required
      const assignment = {
        id: 'prop-intv-116',
        candidateId: 'cand-01',
        interviewerIds: ['int-01', 'int-02'],
        roomId: 'room-small',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, context);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.ROOM_CAPACITY_EXCEEDED);
      assert.ok(violation, 'Must report ROOM_CAPACITY_EXCEEDED');
      assert.equal(violation.details.roomCapacity, 2);
      assert.equal(violation.details.requiredCapacity, 3);
    });

    it('11.2 should report ROOM_TYPE_MISMATCH when room type does not match required type', () => {
      const assignment = {
        id: 'prop-intv-117',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01', // Room 01 is 'Hybrid Physical'
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45',
        requiredRoomType: 'Virtual Hub'
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.ROOM_TYPE_MISMATCH);
      assert.ok(violation, 'Must report ROOM_TYPE_MISMATCH');
      assert.equal(violation.details.actualType, 'Hybrid Physical');
      assert.equal(violation.details.requiredType, 'Virtual Hub');
    });

    it('11.3 should report ROOM_EQUIPMENT_MISSING when room lacks required equipment', () => {
      const assignment = {
        id: 'prop-intv-118',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01', // Room 01 has ['4K Ultra HD Display', 'Dual Glass Whiteboards']
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45',
        requiredEquipment: ['Digital Wacom Tablet', 'Dual Glass Whiteboards'] // Tablet missing
      };

      const result = validateAssignment(assignment, defaultContext);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.ROOM_EQUIPMENT_MISSING);
      assert.ok(violation, 'Must report ROOM_EQUIPMENT_MISSING');
      assert.deepEqual(violation.details.missingEquipment, ['Digital Wacom Tablet']);
    });

    it('11.4 should report ROOM_STATUS_UNAVAILABLE when room is in Maintenance', () => {
      const maintenanceRoom = {
        id: 'room-maint',
        name: 'Executive Boardroom',
        status: 'Maintenance',
        currentStatusNote: 'AV Firmware upgrade'
      };

      const context = {
        ...defaultContext,
        rooms: [maintenanceRoom]
      };

      const assignment = {
        id: 'prop-intv-119',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-maint',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, context);

      assert.equal(result.valid, false);
      const violation = result.violations.find(v => v.code === VIOLATION_CODES.ROOM_STATUS_UNAVAILABLE);
      assert.ok(violation, 'Must report ROOM_STATUS_UNAVAILABLE');
    });
  });

  // =========================================================================
  // 12. LOCKED / CONFIRMED BOOKING PROTECTION
  // =========================================================================
  describe('12. Locked Booking Protection', () => {
    it('12.1 should report BOOKING_LOCKED_CONFLICT when proposed assignment collides with an immovable confirmed booking', () => {
      const contextWithLockedBooking = {
        ...defaultContext,
        existingInterviews: [
          {
            id: 'intv-locked-master',
            candidateId: 'cand-vip',
            interviewerIds: ['int-01'],
            roomId: 'room-01',
            date: '2026-11-02',
            startTime: '10:00',
            endTime: '10:45',
            status: 'Confirmed',
            isLocked: true
          }
        ]
      };

      const assignment = {
        id: 'prop-intv-120',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:15', // Overlaps locked booking
        endTime: '11:00'
      };

      const result = validateAssignment(assignment, contextWithLockedBooking);

      assert.equal(result.valid, false);
      const lockedViolation = result.violations.find(v => v.code === VIOLATION_CODES.BOOKING_LOCKED_CONFLICT);
      assert.ok(lockedViolation, 'Must report BOOKING_LOCKED_CONFLICT');
      assert.equal(lockedViolation.details.lockedInterviewId, 'intv-locked-master');
    });
  });

  // =========================================================================
  // 13. TIMEZONE VALIDATION
  // =========================================================================
  describe('13. Timezone Validation', () => {
    it('13.1 should report INVALID_TIMEZONE when an invalid timezone identifier is supplied in context', () => {
      const contextInvalidTz = {
        ...defaultContext,
        timezone: 'Invalid/NonExistent_Zone'
      };

      const assignment = {
        id: 'prop-intv-121',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45'
      };

      const result = validateAssignment(assignment, contextInvalidTz);

      assert.equal(result.valid, false);
      const tzViolation = result.violations.find(v => v.code === VIOLATION_CODES.INVALID_TIMEZONE);
      assert.ok(tzViolation, 'Must report INVALID_TIMEZONE');
    });
  });

  // =========================================================================
  // 14. MULTIPLE VIOLATIONS IN A SINGLE ASSIGNMENT
  // =========================================================================
  describe('14. Multiple Simultaneous Violations', () => {
    it('14.1 should aggregate all applicable violations rather than short-circuiting on the first error', () => {
      const badContext = {
        ...defaultContext,
        rooms: [{ ...validRoom, status: 'Maintenance' }],
        existingInterviews: [
          {
            id: 'conf-cand',
            candidateId: 'cand-01',
            date: '2026-11-02',
            startTime: '08:00',
            endTime: '09:00',
            status: 'Scheduled'
          },
          {
            id: 'conf-int',
            interviewerIds: ['int-01'],
            date: '2026-11-02',
            startTime: '08:00',
            endTime: '09:00',
            status: 'Scheduled'
          }
        ]
      };

      // Proposed assignment with:
      // 1. Candidate double-booking (08:30 overlaps 08:00-09:00)
      // 2. Interviewer double-booking (08:30 overlaps 08:00-09:00)
      // 3. Operating hours exceeded (starts at 08:30 before 09:00 op start)
      // 4. Room in maintenance (room-01 is under Maintenance)
      // 5. Missing skills (requires 'Quantum Algorithms')
      const assignment = {
        id: 'prop-intv-multi',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '08:30',
        endTime: '09:15',
        requiredSkills: ['Quantum Algorithms']
      };

      const result = validateAssignment(assignment, badContext);

      assert.equal(result.valid, false);
      assert.equal(result.violations.length >= 5, true, `Expected >= 5 violations, got ${result.violations.length}`);

      const codes = new Set(result.violations.map(v => v.code));
      assert.ok(codes.has(VIOLATION_CODES.CANDIDATE_DOUBLE_BOOKED));
      assert.ok(codes.has(VIOLATION_CODES.INTERVIEWER_DOUBLE_BOOKED));
      assert.ok(codes.has(VIOLATION_CODES.OPERATING_HOURS_EXCEEDED));
      assert.ok(codes.has(VIOLATION_CODES.ROOM_STATUS_UNAVAILABLE));
      assert.ok(codes.has(VIOLATION_CODES.INTERVIEWER_SKILLS_DEFICIENT));
    });
  });

  // =========================================================================
  // 15. MISSING OPTIONAL DATA & UNSUPPORTED CONSTRAINTS
  // =========================================================================
  describe('15. Missing Optional Data & Unsupported Constraints', () => {
    it('15.1 should handle minimal assignment and empty context gracefully without false violations', () => {
      // Bare assignment without optional skills, equipment, operating hours, or candidate windows
      const minimalAssignment = {
        id: 'prop-minimal',
        candidateId: 'cand-01',
        interviewerIds: ['int-01'],
        roomId: 'room-01',
        date: '2026-11-02',
        startTime: '10:00',
        endTime: '10:45'
      };

      // Completely empty context
      const emptyContext = {};

      const result = validateAssignment(minimalAssignment, emptyContext);

      assert.equal(result.valid, true, 'Minimal assignment with empty context should be valid');
      assert.equal(result.violations.length, 0);
    });
  });

  // =========================================================================
  // 16. BATCH VALIDATION
  // =========================================================================
  describe('16. Batch Validation', () => {
    it('16.1 should validate a list of proposed assignments via validateScheduleBatch', () => {
      const batch = [
        {
          id: 'intv-batch-1',
          candidateId: 'cand-01',
          interviewerIds: ['int-01'],
          roomId: 'room-01',
          date: '2026-11-02',
          startTime: '10:00',
          endTime: '10:45'
        },
        {
          id: 'intv-batch-2',
          candidateId: 'cand-01',
          interviewerIds: ['int-01'],
          roomId: 'room-01',
          date: '2026-11-02',
          startTime: '19:00', // Exceeds 18:00
          endTime: '19:45'
        }
      ];

      const batchResults = validateScheduleBatch(batch, defaultContext);

      assert.equal(batchResults.length, 2);
      assert.equal(batchResults[0].valid, true);
      assert.equal(batchResults[1].valid, false);
      assert.ok(batchResults[1].violations.some(v => v.code === VIOLATION_CODES.OPERATING_HOURS_EXCEEDED));
    });
  });
});
