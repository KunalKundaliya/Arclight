/**
 * ArcLight - Time Grid Generator
 * 
 * Generates discrete half-open interview time slots [start, end) across recruitment drive dates
 * based on configurable daily operating hours, interview durations, slot granularity,
 * IANA timezones, and blackout periods.
 * 
 * Buffer Architecture:
 * - Generated slots represent the exact interview session: [startTime, endTime).
 * - Room occupancy is strictly limited to [startTime, endTime) (the physical/virtual room is freed when the interview concludes).
 * - Interviewer buffers (e.g., 15 minutes of rest/notes) are NOT baked into room occupancy.
 *   Instead, the scheduler enforces interviewer buffers as a resource-specific separation constraint
 *   (i.e. intervalB.start >= intervalA.end + bufferMinutes for the same interviewer).
 * - This prevents artificial room starvation while guaranteeing interviewer rest.
 */

import {
  validateTimezone,
  parseDateString,
  parseTimeString,
  localDateTimeToUtc,
  utcToLocalDateTime
} from './TimezoneUtils.js';
import { doIntervalsOverlap } from './IntervalUtils.js';

/**
 * Formats integer minutes from midnight into 'HH:mm' string format.
 * 
 * @param {number} totalMinutes - e.g. 540 -> '09:00', 585 -> '09:45'
 * @returns {string}
 */
export function formatMinutesToTime(totalMinutes) {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0 || totalMinutes >= 24 * 60) {
    throw new RangeError(`totalMinutes must be an integer between 0 and 1439, received ${totalMinutes}`);
  }
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Generates an array of date strings (YYYY-MM-DD) between startDate and endDate, inclusive.
 * Validates calendar validity and ensures startDate <= endDate.
 * 
 * @param {string} startDateStr - 'YYYY-MM-DD'
 * @param {string} endDateStr - 'YYYY-MM-DD'
 * @returns {string[]} Array of date strings inclusive
 */
export function generateDateRange(startDateStr, endDateStr) {
  const start = parseDateString(startDateStr);
  const end = parseDateString(endDateStr);

  const startDateObj = new Date(Date.UTC(start.year, start.month - 1, start.day));
  const endDateObj = new Date(Date.UTC(end.year, end.month - 1, end.day));

  if (startDateObj > endDateObj) {
    throw new RangeError(`startDate ("${startDateStr}") cannot be after endDate ("${endDateStr}")`);
  }

  const dates = [];
  const curr = new Date(startDateObj);

  while (curr <= endDateObj) {
    const y = curr.getUTCFullYear();
    const m = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const d = String(curr.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Generates valid candidate interview slots for a single calendar date.
 * 
 * @param {Object} options
 * @param {string} options.date - 'YYYY-MM-DD'
 * @param {string} [options.operatingStartTime='09:00'] - 'HH:mm'
 * @param {string} [options.operatingEndTime='18:00'] - 'HH:mm'
 * @param {number} options.interviewDurationMinutes - Positive integer (e.g. 45)
 * @param {number} [options.slotGranularityMinutes] - Positive integer step between slot starts. Defaults to interviewDurationMinutes.
 * @param {string} options.timezone - Required IANA timezone (e.g. 'Asia/Kolkata', 'America/New_York')
 * @param {Array<{startTime: string, endTime: string}>} [options.blackoutPeriods=[]] - Configured unavailable windows (e.g. lunch breaks)
 * @returns {Array<Object>} Array of half-open slot descriptors
 */
export function generateDailySlots({
  date,
  operatingStartTime = '09:00',
  operatingEndTime = '18:00',
  interviewDurationMinutes,
  slotGranularityMinutes,
  timezone,
  blackoutPeriods = []
}) {
  // Validate date
  parseDateString(date);

  // Validate timezone
  const resolvedZone = validateTimezone(timezone);

  // Validate operating times
  const opStart = parseTimeString(operatingStartTime);
  const opEnd = parseTimeString(operatingEndTime);

  if (opStart.totalMinutes >= opEnd.totalMinutes) {
    throw new RangeError(`operatingStartTime ("${operatingStartTime}") must be strictly before operatingEndTime ("${operatingEndTime}")`);
  }

  // Validate duration
  if (
    typeof interviewDurationMinutes !== 'number' ||
    !Number.isInteger(interviewDurationMinutes) ||
    interviewDurationMinutes <= 0
  ) {
    throw new RangeError(`interviewDurationMinutes must be a positive integer, received: ${interviewDurationMinutes}`);
  }

  // Validate granularity
  const granularity = slotGranularityMinutes !== undefined ? slotGranularityMinutes : interviewDurationMinutes;
  if (
    typeof granularity !== 'number' ||
    !Number.isInteger(granularity) ||
    granularity <= 0
  ) {
    throw new RangeError(`slotGranularityMinutes must be a positive integer, received: ${slotGranularityMinutes}`);
  }

  // Parse and validate blackout periods
  const parsedBlackouts = (blackoutPeriods || []).map((bp, idx) => {
    if (!bp || typeof bp !== 'object') {
      throw new TypeError(`Blackout period at index ${idx} must be an object with startTime and endTime`);
    }
    const bStart = parseTimeString(bp.startTime);
    const bEnd = parseTimeString(bp.endTime);
    if (bStart.totalMinutes >= bEnd.totalMinutes) {
      throw new RangeError(`Blackout period at index ${idx} startTime must be before endTime`);
    }
    return {
      startMinuteOfDay: bStart.totalMinutes,
      endMinuteOfDay: bEnd.totalMinutes,
      label: bp.label || 'Blackout Period'
    };
  });

  const slots = [];
  const opStartMin = opStart.totalMinutes;
  const opEndMin = opEnd.totalMinutes;

  // Step through day in increments of granularity
  for (let startMin = opStartMin; startMin + interviewDurationMinutes <= opEndMin; startMin += granularity) {
    const endMin = startMin + interviewDurationMinutes;

    const candidateInterval = {
      startMinuteOfDay: startMin,
      endMinuteOfDay: endMin
    };

    // Exclude if overlapping with any blackout period
    const overlapsBlackout = parsedBlackouts.some(bp => doIntervalsOverlap(candidateInterval, bp));
    if (overlapsBlackout) {
      continue;
    }

    const startTimeStr = formatMinutesToTime(startMin);
    const endTimeStr = formatMinutesToTime(endMin);

    // Compute canonical UTC timestamps
    const startUtc = localDateTimeToUtc(date, startTimeStr, resolvedZone);
    const endUtc = localDateTimeToUtc(date, endTimeStr, resolvedZone);
    const localInfo = utcToLocalDateTime(startUtc.epochMs, resolvedZone);

    slots.push({
      id: `slot_${date}_${startTimeStr.replace(':', '')}`,
      date,
      dayOfWeek: localInfo.dayOfWeek,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMinutes: interviewDurationMinutes,
      startMinuteOfDay: startMin,
      endMinuteOfDay: endMin,
      startUtc: startUtc.iso,
      endUtc: endUtc.iso,
      startEpochMs: startUtc.epochMs,
      endEpochMs: endUtc.epochMs,
      timezone: resolvedZone
    });
  }

  return slots;
}

/**
 * Generates the full interview time grid across an entire recruitment drive date range.
 * 
 * @param {Object} options
 * @param {string} options.startDate - 'YYYY-MM-DD'
 * @param {string} options.endDate - 'YYYY-MM-DD'
 * @param {string} [options.operatingStartTime='09:00']
 * @param {string} [options.operatingEndTime='18:00']
 * @param {number} options.interviewDurationMinutes
 * @param {number} [options.slotGranularityMinutes]
 * @param {string} options.timezone
 * @param {Array<{startTime: string, endTime: string}>} [options.blackoutPeriods=[]]
 * @returns {{
 *   dates: string[],
 *   totalDays: number,
 *   totalSlots: number,
 *   operatingStartTime: string,
 *   operatingEndTime: string,
 *   interviewDurationMinutes: number,
 *   slotGranularityMinutes: number,
 *   timezone: string,
 *   slots: Array<Object>
 * }}
 */
export function generateDriveGrid(options) {
  const dates = generateDateRange(options.startDate, options.endDate);
  const slots = [];

  for (const date of dates) {
    const dailySlots = generateDailySlots({
      ...options,
      date
    });
    slots.push(...dailySlots);
  }

  const granularity = options.slotGranularityMinutes !== undefined
    ? options.slotGranularityMinutes
    : options.interviewDurationMinutes;

  return {
    dates,
    totalDays: dates.length,
    totalSlots: slots.length,
    operatingStartTime: options.operatingStartTime || '09:00',
    operatingEndTime: options.operatingEndTime || '18:00',
    interviewDurationMinutes: options.interviewDurationMinutes,
    slotGranularityMinutes: granularity,
    timezone: validateTimezone(options.timezone),
    slots
  };
}

/**
 * Computes the sequential chain of valid interview start times for an individual interviewer
 * when a mandatory post-interview buffer is enforced between consecutive interviews.
 * 
 * Demonstrates the benchmark example:
 * 09:00-12:00 operating window, 45-minute duration, 15-minute buffer:
 * -> Slot 1: [09:00, 09:45), buffer [09:45, 10:00). Next valid start: 10:00
 * -> Slot 2: [10:00, 10:45), buffer [10:45, 11:00). Next valid start: 11:00
 * -> Slot 3: [11:00, 11:45), buffer [11:45, 12:00). Next potential start: 12:00 (ends 12:45 > 12:00 -> EXCLUDED)
 * Valid start times: ['09:00', '10:00', '11:00'].
 * 
 * @param {Object} params
 * @param {string} [params.operatingStartTime='09:00']
 * @param {string} [params.operatingEndTime='12:00']
 * @param {number} [params.interviewDurationMinutes=45]
 * @param {number} [params.interviewerBufferMinutes=15]
 * @returns {string[]} List of valid interview start times
 */
export function computeValidInterviewerStartTimes({
  operatingStartTime = '09:00',
  operatingEndTime = '12:00',
  interviewDurationMinutes = 45,
  interviewerBufferMinutes = 15
}) {
  const opStart = parseTimeString(operatingStartTime);
  const opEnd = parseTimeString(operatingEndTime);

  if (opStart.totalMinutes >= opEnd.totalMinutes) {
    throw new RangeError('operatingStartTime must be strictly before operatingEndTime');
  }

  const validStartTimes = [];
  let currentStartMin = opStart.totalMinutes;
  const opEndMin = opEnd.totalMinutes;

  while (currentStartMin + interviewDurationMinutes <= opEndMin) {
    validStartTimes.push(formatMinutesToTime(currentStartMin));
    // Advance to next valid start time by adding interview duration + mandatory separation buffer
    currentStartMin += (interviewDurationMinutes + interviewerBufferMinutes);
  }

  return validStartTimes;
}
