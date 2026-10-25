/**
 * ArcLight - Timezone Utilities
 * 
 * Provides robust timezone validation and bidirectional conversion between local
 * calendar date/time representations and canonical UTC ISO timestamps/epoch milliseconds.
 * 
 * Strategy:
 * 1. Leverages Node.js built-in Intl.DateTimeFormat (backed by ICU) for complete IANA timezone support.
 * 2. Strictly validates IANA timezone identifiers; throws RangeError if invalid, avoiding silent fallbacks.
 * 3. Supports Daylight Saving Time (DST) shifts (spring-forward and fall-back) using an iterative offset
 *    convergence algorithm without requiring external libraries.
 */

/**
 * Validates an IANA timezone identifier.
 * Throws TypeError if the identifier is missing or not a string.
 * Throws RangeError if the identifier is not recognized by the standard IANA database.
 * 
 * @param {string} timeZone - IANA timezone identifier (e.g. 'Asia/Kolkata', 'America/New_York', 'UTC')
 * @returns {string} The resolved canonical timezone identifier
 */
export function validateTimezone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string' || timeZone.trim() === '') {
    throw new TypeError('Timezone must be a non-empty string');
  }

  const trimmed = timeZone.trim();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: trimmed });
    return formatter.resolvedOptions().timeZone;
  } catch (err) {
    throw new RangeError(`Invalid IANA timezone identifier: "${timeZone}". Must be a valid IANA zone (e.g. 'Asia/Kolkata', 'America/New_York', 'UTC').`);
  }
}

/**
 * Verifies that calendar date components form a real calendar day (e.g. rejects Feb 29 on non-leap years, April 31, etc.)
 * 
 * @param {number} year 
 * @param {number} month (1-12)
 * @param {number} day (1-31)
 * @returns {boolean}
 */
export function isValidCalendarDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.getUTCFullYear() === year &&
         (dateObj.getUTCMonth() + 1) === month &&
         dateObj.getUTCDate() === day;
}

/**
 * Parses and validates a date string in YYYY-MM-DD format.
 * 
 * @param {string} dateStr 
 * @returns {{ year: number, month: number, day: number }}
 */
export function parseDateString(dateStr) {
  if (typeof dateStr !== 'string') {
    throw new TypeError(`Date must be a string in YYYY-MM-DD format, received ${typeof dateStr}`);
  }
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new RangeError(`Invalid date format: "${dateStr}". Expected format: YYYY-MM-DD`);
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (!isValidCalendarDate(year, month, day)) {
    throw new RangeError(`Invalid calendar date: "${dateStr}". Day does not exist in month.`);
  }

  return { year, month, day };
}

/**
 * Parses and validates a time string in HH:mm or HH:mm:ss format.
 * 
 * @param {string} timeStr 
 * @returns {{ hour: number, minute: number, second: number, totalMinutes: number }}
 */
export function parseTimeString(timeStr) {
  if (typeof timeStr !== 'string') {
    throw new TypeError(`Time must be a string in HH:mm or HH:mm:ss format, received ${typeof timeStr}`);
  }
  const match = timeStr.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new RangeError(`Invalid time format: "${timeStr}". Expected format: HH:mm or HH:mm:ss`);
  }
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const second = match[3] ? parseInt(match[3], 10) : 0;

  if (hour < 0 || hour > 23) {
    throw new RangeError(`Invalid hour: ${hour}. Must be between 00 and 23.`);
  }
  if (minute < 0 || minute > 59) {
    throw new RangeError(`Invalid minute: ${minute}. Must be between 00 and 59.`);
  }
  if (second < 0 || second > 59) {
    throw new RangeError(`Invalid second: ${second}. Must be between 00 and 59.`);
  }

  return { hour, minute, second, totalMinutes: hour * 60 + minute };
}

/**
 * Converts a local calendar date and time in a specified IANA timezone into canonical UTC values.
 * Correctly accounts for standard offsets and Daylight Saving Time (DST) shifts.
 * 
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:mm' or 'HH:mm:ss'
 * @param {string} timeZone - IANA timezone identifier
 * @returns {{ iso: string, epochMs: number, date: Date, timezone: string }}
 */
export function localDateTimeToUtc(dateStr, timeStr, timeZone) {
  const resolvedZone = validateTimezone(timeZone);
  const { year, month, day } = parseDateString(dateStr);
  const { hour, minute, second } = parseTimeString(timeStr);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: resolvedZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const getZonedTimeAsUtcEpoch = (epochMs) => {
    const parts = formatter.formatToParts(new Date(epochMs));
    const obj = {};
    for (const p of parts) obj[p.type] = p.value;
    let h = parseInt(obj.hour, 10);
    if (h === 24) h = 0; // Handle 24:00 edge case in some locales
    return Date.UTC(
      parseInt(obj.year, 10),
      parseInt(obj.month, 10) - 1,
      parseInt(obj.day, 10),
      h,
      parseInt(obj.minute, 10),
      parseInt(obj.second, 10)
    );
  };

  // Initial estimate: treat local time components directly as a UTC timestamp
  const initialUtcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  // Compute offset difference between the timezone's clock and UTC
  const offset1 = getZonedTimeAsUtcEpoch(initialUtcGuess) - initialUtcGuess;
  let finalEpochMs = initialUtcGuess - offset1;

  // Second pass handles DST boundary crossings
  const offset2 = getZonedTimeAsUtcEpoch(finalEpochMs) - finalEpochMs;
  if (offset2 !== offset1) {
    finalEpochMs = initialUtcGuess - offset2;
  }

  const finalDate = new Date(finalEpochMs);
  return {
    iso: finalDate.toISOString(),
    epochMs: finalEpochMs,
    date: finalDate,
    timezone: resolvedZone
  };
}

/**
 * Converts a UTC epoch or Date object back into local date and time parts in the specified timezone.
 * 
 * @param {Date|number} dateOrEpochMs 
 * @param {string} timeZone 
 * @returns {{ dateStr: string, timeStr: string, dayOfWeek: string, timezone: string }}
 */
export function utcToLocalDateTime(dateOrEpochMs, timeZone) {
  const resolvedZone = validateTimezone(timeZone);
  const epoch = dateOrEpochMs instanceof Date ? dateOrEpochMs.getTime() : Number(dateOrEpochMs);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: resolvedZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date(epoch));
  const obj = {};
  for (const p of parts) obj[p.type] = p.value;

  let hour = obj.hour;
  if (hour === '24') hour = '00';

  return {
    dateStr: `${obj.year}-${obj.month}-${obj.day}`,
    timeStr: `${hour}:${obj.minute}`,
    dayOfWeek: obj.weekday,
    timezone: resolvedZone
  };
}

/**
 * Computes the timezone offset in minutes (local - UTC) for a specific local date and time.
 * For example: Asia/Kolkata (+05:30) returns +330.
 * 
 * @param {string} dateStr 
 * @param {string} timeStr 
 * @param {string} timeZone 
 * @returns {number} Offset in minutes
 */
export function getTimezoneOffsetMinutes(dateStr, timeStr, timeZone) {
  const { epochMs } = localDateTimeToUtc(dateStr, timeStr, timeZone);
  const { year, month, day } = parseDateString(dateStr);
  const { hour, minute, second } = parseTimeString(timeStr);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((naiveUtc - epochMs) / (60 * 1000));
}
