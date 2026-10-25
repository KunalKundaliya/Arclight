import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateTimezone,
  parseDateString,
  parseTimeString,
  localDateTimeToUtc,
  utcToLocalDateTime,
  getTimezoneOffsetMinutes
} from './TimezoneUtils.js';

import {
  doIntervalsOverlap,
  areIntervalsAdjacent,
  isIntervalWithinWindow,
  getIntervalGap,
  hasBufferViolation,
  compareIntervals,
  normalizeInterval
} from './IntervalUtils.js';

import {
  formatMinutesToTime,
  generateDateRange,
  generateDailySlots,
  generateDriveGrid,
  computeValidInterviewerStartTimes
} from './TimeGridGenerator.js';

describe('Stage 2: Time-Grid Generator and Interval Utilities', () => {

  // =========================================================================
  // 1. DATE RANGE GENERATION TESTS
  // =========================================================================
  describe('1. Date Range Generation', () => {
    it('1.1 should generate a single day when start and end dates are identical', () => {
      const dates = generateDateRange('2026-11-02', '2026-11-02');
      assert.deepEqual(dates, ['2026-11-02']);
      assert.equal(dates.length, 1);
    });

    it('1.2 should generate dates across multiple days and month boundaries', () => {
      const dates = generateDateRange('2026-10-30', '2026-11-03');
      assert.deepEqual(dates, [
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
        '2026-11-02',
        '2026-11-03'
      ]);
      assert.equal(dates.length, 5);
    });

    it('1.3 should verify inclusive start and end dates', () => {
      const dates = generateDateRange('2026-11-02', '2026-11-06');
      assert.equal(dates[0], '2026-11-02', 'First element must match startDate');
      assert.equal(dates[dates.length - 1], '2026-11-06', 'Last element must match endDate');
      assert.equal(dates.length, 5);
    });

    it('1.4 should throw when startDate is chronologically after endDate', () => {
      assert.throws(
        () => generateDateRange('2026-11-06', '2026-11-02'),
        /startDate .* cannot be after endDate/
      );
    });

    it('1.5 should throw for non-existent calendar dates (e.g. Feb 31 or invalid leap years)', () => {
      assert.throws(() => parseDateString('2026-02-31'), /Invalid calendar date/);
      assert.throws(() => parseDateString('2026-02-29'), /Invalid calendar date/); // 2026 is not a leap year
      assert.doesNotThrow(() => parseDateString('2024-02-29')); // 2024 is a leap year
    });
  });

  // =========================================================================
  // 2. DAILY SLOT GENERATION & BOUNDARY TESTS
  // =========================================================================
  describe('2. Daily Slot Generation & Boundary Handling', () => {
    it('2.1 should generate slots for a single day with expected count and half-open structure', () => {
      const slots = generateDailySlots({
        date: '2026-11-02',
        operatingStartTime: '09:00',
        operatingEndTime: '11:00',
        interviewDurationMinutes: 60,
        slotGranularityMinutes: 60,
        timezone: 'Asia/Kolkata'
      });

      assert.equal(slots.length, 2);
      assert.equal(slots[0].startTime, '09:00');
      assert.equal(slots[0].endTime, '10:00');
      assert.equal(slots[1].startTime, '10:00');
      assert.equal(slots[1].endTime, '11:00');
    });

    it('2.2 should support different interview durations (30m, 45m, 60m)', () => {
      // 30m duration in a 2-hour window (09:00 to 11:00) with 30m granularity
      const slots30 = generateDailySlots({
        date: '2026-11-02',
        operatingStartTime: '09:00',
        operatingEndTime: '11:00',
        interviewDurationMinutes: 30,
        slotGranularityMinutes: 30,
        timezone: 'Asia/Kolkata'
      });
      assert.equal(slots30.length, 4);
      assert.equal(slots30[0].endTime, '09:30');
      assert.equal(slots30[3].endTime, '11:00');

      // 45m duration with 45m granularity in 09:00 to 12:00 (180 min)
      // 180 / 45 = 4 slots: 09:00-09:45, 09:45-10:30, 10:30-11:15, 11:15-12:00
      const slots45 = generateDailySlots({
        date: '2026-11-02',
        operatingStartTime: '09:00',
        operatingEndTime: '12:00',
        interviewDurationMinutes: 45,
        slotGranularityMinutes: 45,
        timezone: 'Asia/Kolkata'
      });
      assert.equal(slots45.length, 4);
      assert.equal(slots45[0].startTime, '09:00');
      assert.equal(slots45[0].endTime, '09:45');
      assert.equal(slots45[3].startTime, '11:15');
      assert.equal(slots45[3].endTime, '12:00');
    });

    it('2.3 should support fine-grained slot granularity (e.g. 15-minute start steps)', () => {
      // 09:00 to 10:30 (90 min window), 45-minute interviews, 15-minute granularity
      // Valid starts: 09:00 (ends 09:45), 09:15 (ends 10:00), 09:30 (ends 10:15), 09:45 (ends 10:30)
      // 10:00 would end at 10:45 > 10:30, so excluded.
      const slots = generateDailySlots({
        date: '2026-11-02',
        operatingStartTime: '09:00',
        operatingEndTime: '10:30',
        interviewDurationMinutes: 45,
        slotGranularityMinutes: 15,
        timezone: 'Asia/Kolkata'
      });

      assert.equal(slots.length, 4);
      assert.deepEqual(slots.map(s => s.startTime), ['09:00', '09:15', '09:30', '09:45']);
      assert.deepEqual(slots.map(s => s.endTime), ['09:45', '10:00', '10:15', '10:30']);
    });

    it('2.4 should strictly exclude slots that extend beyond operating hours', () => {
      // 09:00 to 12:00 window, 45-minute duration, 15-minute granularity
      const slots = generateDailySlots({
        date: '2026-11-02',
        operatingStartTime: '09:00',
        operatingEndTime: '12:00',
        interviewDurationMinutes: 45,
        slotGranularityMinutes: 15,
        timezone: 'Asia/Kolkata'
      });

      // Last valid slot must start at 11:15 and end at 12:00.
      // A slot starting at 11:30 would end at 12:15, extending beyond 12:00, and must NOT exist.
      const lastSlot = slots[slots.length - 1];
      assert.equal(lastSlot.startTime, '11:15');
      assert.equal(lastSlot.endTime, '12:00');
      assert.equal(slots.some(s => s.startTime === '11:30'), false);
      assert.equal(slots.some(s => s.startTime === '12:00'), false);
    });

    it('2.5 should throw RangeError for invalid start and end times', () => {
      // operatingStartTime >= operatingEndTime
      assert.throws(
        () => generateDailySlots({
          date: '2026-11-02',
          operatingStartTime: '18:00',
          operatingEndTime: '09:00',
          interviewDurationMinutes: 45,
          timezone: 'Asia/Kolkata'
        }),
        /operatingStartTime .* must be strictly before operatingEndTime/
      );

      // Malformed time strings
      assert.throws(() => parseTimeString('25:00'), /Invalid hour/);
      assert.throws(() => parseTimeString('12:60'), /Invalid minute/);
      assert.throws(() => parseTimeString('9:5'), /Invalid time format/);
    });

    it('2.6 should throw RangeError for invalid or non-positive interview durations', () => {
      assert.throws(
        () => generateDailySlots({
          date: '2026-11-02',
          interviewDurationMinutes: 0,
          timezone: 'Asia/Kolkata'
        }),
        /interviewDurationMinutes must be a positive integer/
      );

      assert.throws(
        () => generateDailySlots({
          date: '2026-11-02',
          interviewDurationMinutes: -30,
          timezone: 'Asia/Kolkata'
        }),
        /interviewDurationMinutes must be a positive integer/
      );

      assert.throws(
        () => generateDailySlots({
          date: '2026-11-02',
          interviewDurationMinutes: 45.5,
          timezone: 'Asia/Kolkata'
        }),
        /interviewDurationMinutes must be a positive integer/
      );
    });

    it('2.7 should support and exclude configured blackout periods (e.g. lunch breaks)', () => {
      // 09:00 to 14:00, 60m duration, lunch blackout from 12:00 to 13:00
      const slots = generateDailySlots({
        date: '2026-11-02',
        operatingStartTime: '09:00',
        operatingEndTime: '14:00',
        interviewDurationMinutes: 60,
        slotGranularityMinutes: 60,
        timezone: 'Asia/Kolkata',
        blackoutPeriods: [
          { startTime: '12:00', endTime: '13:00', label: 'Faculty Lunch Break' }
        ]
      });

      // Expected slots: 09:00-10:00, 10:00-11:00, 11:00-12:00, 13:00-14:00
      // 12:00-13:00 must be excluded
      assert.equal(slots.length, 4);
      assert.deepEqual(slots.map(s => s.startTime), ['09:00', '10:00', '11:00', '13:00']);
      assert.equal(slots.some(s => s.startTime === '12:00'), false);
    });
  });

  // =========================================================================
  // 3. INTERVAL UTILITIES & HALF-OPEN ARITHMETIC TESTS
  // =========================================================================
  describe('3. Interval Utilities & Half-Open Mathematics', () => {
    it('3.1 should verify that adjacent intervals meeting at a boundary do NOT overlap', () => {
      // Interview A: [09:00, 09:45) = [540, 585)
      // Interview B: [09:45, 10:30) = [585, 630)
      const intvA = { start: 540, end: 585 };
      const intvB = { start: 585, end: 630 };

      // Rule: startA < endB && startB < endA
      // 540 < 630 (true), but 585 < 585 is FALSE.
      assert.equal(doIntervalsOverlap(intvA, intvB), false, 'Adjacent intervals must NOT overlap');
      assert.equal(areIntervalsAdjacent(intvA, intvB), true, 'Intervals must be recognized as adjacent');
    });

    it('3.2 should detect overlapping intervals correctly', () => {
      // [09:00, 10:00) = [540, 600)
      // [09:30, 10:30) = [570, 630)
      const intvA = { start: 540, end: 600 };
      const intvB = { start: 570, end: 630 };

      assert.equal(doIntervalsOverlap(intvA, intvB), true);
      assert.equal(getIntervalGap(intvA, intvB) < 0, true, 'Overlapping intervals must have negative gap');
    });

    it('3.3 should verify availability-window containment', () => {
      const window = { start: 540, end: 1080 }; // [09:00, 18:00)

      const fits = { start: 540, end: 585 }; // [09:00, 09:45)
      const extendsPast = { start: 1050, end: 1095 }; // [17:30, 18:15)
      const beforeStart = { start: 510, end: 555 }; // [08:30, 09:15)

      assert.equal(isIntervalWithinWindow(fits, window), true);
      assert.equal(isIntervalWithinWindow(extendsPast, window), false);
      assert.equal(isIntervalWithinWindow(beforeStart, window), false);
    });

    it('3.4 should sort intervals chronologically with compareIntervals', () => {
      const unsorted = [
        { start: 600, end: 645 },
        { start: 540, end: 585 },
        { start: 540, end: 600 }
      ];

      const sorted = [...unsorted].sort(compareIntervals);
      assert.deepEqual(sorted, [
        { start: 540, end: 585 },
        { start: 540, end: 600 },
        { start: 600, end: 645 }
      ]);
    });
  });

  // =========================================================================
  // 4. RESOURCE BUFFER ENFORCEMENT & 09:00-12:00 BENCHMARK
  // =========================================================================
  describe('4. Resource-Specific Buffer Enforcement & Canonical Benchmark', () => {
    it('4.1 should distinguish between direct overlap and buffer violation', () => {
      const intvA = { start: 540, end: 585 }; // [09:00, 09:45)
      const intvAdjacent = { start: 585, end: 630 }; // [09:45, 10:30) (gap = 0m)
      const intvSpaced15 = { start: 600, end: 645 }; // [10:00, 10:45) (gap = 15m)
      const intvSpaced10 = { start: 595, end: 640 }; // [09:55, 10:40) (gap = 10m)

      // An adjacent interview has NO direct overlap (room could host different interview)
      assert.equal(doIntervalsOverlap(intvA, intvAdjacent), false);

      // But for the SAME interviewer, a 15-minute buffer requirement is violated by gap = 0
      assert.equal(hasBufferViolation(intvA, intvAdjacent, 15), true);

      // An interview starting at 10:00 provides exactly 15m gap -> SATISFIES buffer requirement
      assert.equal(hasBufferViolation(intvA, intvSpaced15, 15), false);

      // An interview starting at 09:55 provides only 10m gap (< 15m) -> VIOLATES buffer requirement
      assert.equal(hasBufferViolation(intvA, intvSpaced10, 15), true);
    });

    it('4.2 should verify the canonical 09:00-12:00 benchmark (45m duration, 15m buffer)', () => {
      // Problem statement:
      // Operating hours: 09:00–12:00 (180 minutes).
      // Interview duration: 45 minutes.
      // Interviewer separation buffer: 15 minutes.
      //
      // Sequential back-to-back assignments for that interviewer:
      // 1. First interview starts at 09:00 -> [09:00, 09:45).
      //    Interviewer buffer: [09:45, 10:00).
      // 2. Next valid start time: 10:00 -> [10:00, 10:45).
      //    Interviewer buffer: [10:45, 11:00).
      // 3. Next valid start time: 11:00 -> [11:00, 11:45).
      //    Interviewer buffer: [11:45, 12:00).
      // 4. Next potential interview would start at 12:00 and end at 12:45 > 12:00 (EXCLUDED).
      //
      // Result: The valid sequence of start times for this interviewer is strictly ['09:00', '10:00', '11:00'].

      const validStartTimes = computeValidInterviewerStartTimes({
        operatingStartTime: '09:00',
        operatingEndTime: '12:00',
        interviewDurationMinutes: 45,
        interviewerBufferMinutes: 15
      });

      assert.deepEqual(
        validStartTimes,
        ['09:00', '10:00', '11:00'],
        'Valid start times must be strictly 09:00, 10:00, and 11:00'
      );
      assert.equal(validStartTimes.length, 3);

      // Verify that every pair of consecutive interviews in this sequence has >= 15m buffer
      const slot1 = { start: 9 * 60, end: 9 * 60 + 45 }; // 09:00 - 09:45
      const slot2 = { start: 10 * 60, end: 10 * 60 + 45 }; // 10:00 - 10:45
      const slot3 = { start: 11 * 60, end: 11 * 60 + 45 }; // 11:00 - 11:45

      assert.equal(hasBufferViolation(slot1, slot2, 15), false);
      assert.equal(hasBufferViolation(slot2, slot3, 15), false);
      assert.equal(getIntervalGap(slot1, slot2), 15);
      assert.equal(getIntervalGap(slot2, slot3), 15);
    });
  });

  // =========================================================================
  // 5. TIMEZONE CORRECTNESS & DAYLIGHT SAVING TIME TESTS
  // =========================================================================
  describe('5. Timezone Correctness & Daylight Saving Time', () => {
    it('5.1 should validate standard IANA timezone identifiers', () => {
      assert.equal(validateTimezone('Asia/Kolkata'), 'Asia/Calcutta'); // Standard canonical resolution
      assert.equal(validateTimezone('America/New_York'), 'America/New_York');
      assert.equal(validateTimezone('UTC'), 'UTC');
    });

    it('5.2 should reject invalid timezone identifiers explicitly without silent fallback to UTC', () => {
      assert.throws(() => validateTimezone('Invalid/Zone_Name'), /Invalid IANA timezone identifier/);
      assert.throws(() => validateTimezone('UTC+99'), /Invalid IANA timezone identifier/);
      assert.throws(() => validateTimezone(''), /Timezone must be a non-empty string/);
      assert.throws(() => validateTimezone(null), /Timezone must be a non-empty string/);
      assert.throws(() => validateTimezone(undefined), /Timezone must be a non-empty string/);
    });

    it('5.3 should convert local date and time to canonical UTC ISO string and epoch ms (Asia/Kolkata, UTC+5:30)', () => {
      // 09:00 AM IST on Nov 2, 2026 is 03:30 AM UTC
      const utcResult = localDateTimeToUtc('2026-11-02', '09:00', 'Asia/Kolkata');
      assert.equal(utcResult.iso, '2026-11-02T03:30:00.000Z');
      assert.equal(typeof utcResult.epochMs, 'number');

      // Offset check: +330 minutes
      const offset = getTimezoneOffsetMinutes('2026-11-02', '09:00', 'Asia/Kolkata');
      assert.equal(offset, 330);
    });

    it('5.4 should handle Daylight Saving Time (DST) transitions correctly (America/New_York)', () => {
      // In 2026 in the United States:
      // Daylight Saving Time ends on Sunday, November 1, 2026.
      // - Saturday, Oct 31, 2026 is Eastern Daylight Time (EDT, UTC-4).
      //   09:00 EDT -> 13:00 UTC (9 + 4 = 13:00 UTC).
      // - Monday, Nov 2, 2026 is Eastern Standard Time (EST, UTC-5).
      //   09:00 EST -> 14:00 UTC (9 + 5 = 14:00 UTC).

      const oct31Utc = localDateTimeToUtc('2026-10-31', '09:00', 'America/New_York');
      assert.equal(oct31Utc.iso, '2026-10-31T13:00:00.000Z', 'Oct 31 EDT must be UTC-4 (13:00 UTC)');

      const nov02Utc = localDateTimeToUtc('2026-11-02', '09:00', 'America/New_York');
      assert.equal(nov02Utc.iso, '2026-11-02T14:00:00.000Z', 'Nov 02 EST must be UTC-5 (14:00 UTC)');

      // Verify offset values
      assert.equal(getTimezoneOffsetMinutes('2026-10-31', '09:00', 'America/New_York'), -240); // -4 hours
      assert.equal(getTimezoneOffsetMinutes('2026-11-02', '09:00', 'America/New_York'), -300); // -5 hours
    });

    it('5.5 should handle spring-forward DST transition correctly (America/New_York)', () => {
      // In 2026 in the United States:
      // Daylight Saving Time starts on Sunday, March 8, 2026.
      // - Saturday, March 7, 2026 is EST (UTC-5). 10:00 EST -> 15:00 UTC.
      // - Monday, March 9, 2026 is EDT (UTC-4). 10:00 EDT -> 14:00 UTC.

      const mar07Utc = localDateTimeToUtc('2026-03-07', '10:00', 'America/New_York');
      assert.equal(mar07Utc.iso, '2026-03-07T15:00:00.000Z');

      const mar09Utc = localDateTimeToUtc('2026-03-09', '10:00', 'America/New_York');
      assert.equal(mar09Utc.iso, '2026-03-09T14:00:00.000Z');
    });

    it('5.6 should round-trip between UTC and local representations', () => {
      const origDate = '2026-11-02';
      const origTime = '14:30';
      const zone = 'Asia/Kolkata';

      const utcResult = localDateTimeToUtc(origDate, origTime, zone);
      const roundTrip = utcToLocalDateTime(utcResult.epochMs, zone);

      assert.equal(roundTrip.dateStr, origDate);
      assert.equal(roundTrip.timeStr, origTime);
      assert.equal(roundTrip.dayOfWeek, 'Monday');
    });
  });

  // =========================================================================
  // 6. COMPLETE DRIVE GRID GENERATION TESTS
  // =========================================================================
  describe('6. Full Drive Grid Generation', () => {
    it('6.1 should generate complete recruitment drive grid across multiple days', () => {
      const grid = generateDriveGrid({
        startDate: '2026-11-02',
        endDate: '2026-11-04', // 3 days: Mon, Tue, Wed
        operatingStartTime: '09:00',
        operatingEndTime: '11:00', // 2 hours = 120 min
        interviewDurationMinutes: 60,
        slotGranularityMinutes: 60,
        timezone: 'Asia/Kolkata'
      });

      assert.equal(grid.totalDays, 3);
      assert.deepEqual(grid.dates, ['2026-11-02', '2026-11-03', '2026-11-04']);
      assert.equal(grid.totalSlots, 6); // 2 slots per day * 3 days = 6 slots
      assert.equal(grid.slots[0].date, '2026-11-02');
      assert.equal(grid.slots[0].startTime, '09:00');
      assert.equal(grid.slots[0].endTime, '10:00');
      assert.equal(grid.slots[5].date, '2026-11-04');
      assert.equal(grid.slots[5].startTime, '10:00');
      assert.equal(grid.slots[5].endTime, '11:00');
    });
  });
});
