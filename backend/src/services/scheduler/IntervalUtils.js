/**
 * ArcLight - Half-Open Interval Utilities
 * 
 * Provides rigorous mathematical operations on half-open time intervals [start, end).
 * 
 * In a half-open interval [start, end):
 * - The start boundary is INCLUSIVE (start <= t).
 * - The end boundary is EXCLUSIVE (t < end).
 * 
 * Mathematical Properties:
 * 1. Overlap Rule:
 *    Two half-open intervals A = [startA, endA) and B = [startB, endB) overlap if and only if:
 *    startA < endB && startB < endA
 * 2. Boundary Adjacency:
 *    If endA === startB, the intervals meet exactly at the boundary and do NOT overlap.
 * 3. Containment:
 *    Interval A fits inside window W if and only if:
 *    window.start <= interval.start && interval.end <= window.end
 * 4. Buffer Violation vs. Overlap:
 *    An overlap is a simultaneous collision (same room or same interviewer at the same time).
 *    A buffer violation occurs when two intervals assigned to the SAME resource do not have
 *    sufficient separation time between them (gap < requiredBuffer).
 */

/**
 * Normalizes an interval representation into numeric start and end points.
 * Accepts:
 * - { start, end } (minutes or epoch milliseconds)
 * - { startEpochMs, endEpochMs }
 * - { startMinuteOfDay, endMinuteOfDay }
 * 
 * @param {Object} interval 
 * @param {string} [label='Interval'] 
 * @returns {{ start: number, end: number }}
 */
export function normalizeInterval(interval, label = 'Interval') {
  if (!interval || typeof interval !== 'object') {
    throw new TypeError(`${label} must be a valid object`);
  }

  let start;
  let end;

  if (typeof interval.start === 'number' && typeof interval.end === 'number') {
    start = interval.start;
    end = interval.end;
  } else if (typeof interval.startEpochMs === 'number' && typeof interval.endEpochMs === 'number') {
    start = interval.startEpochMs;
    end = interval.endEpochMs;
  } else if (typeof interval.startMinuteOfDay === 'number' && typeof interval.endMinuteOfDay === 'number') {
    start = interval.startMinuteOfDay;
    end = interval.endMinuteOfDay;
  } else {
    throw new TypeError(`${label} must provide numeric start/end, startEpochMs/endEpochMs, or startMinuteOfDay/endMinuteOfDay`);
  }

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new TypeError(`${label} boundaries cannot be NaN`);
  }

  if (start >= end) {
    throw new RangeError(`${label} start (${start}) must be strictly less than end (${end}) for a valid half-open interval`);
  }

  return { start, end };
}

/**
 * Checks whether two half-open intervals [startA, endA) and [startB, endB) overlap.
 * Strictly enforces: startA < endB && startB < endA.
 * Adjacent intervals meeting at a boundary (endA === startB) return false (no overlap).
 * 
 * @param {Object} intervalA 
 * @param {Object} intervalB 
 * @returns {boolean} True if the intervals overlap
 */
export function doIntervalsOverlap(intervalA, intervalB) {
  const a = normalizeInterval(intervalA, 'Interval A');
  const b = normalizeInterval(intervalB, 'Interval B');
  return a.start < b.end && b.start < a.end;
}

/**
 * Checks whether two half-open intervals meet exactly at a boundary.
 * E.g., [09:00, 09:45) and [09:45, 10:30) are adjacent at 09:45.
 * 
 * @param {Object} intervalA 
 * @param {Object} intervalB 
 * @returns {boolean} True if intervals are adjacent without gap or overlap
 */
export function areIntervalsAdjacent(intervalA, intervalB) {
  const a = normalizeInterval(intervalA, 'Interval A');
  const b = normalizeInterval(intervalB, 'Interval B');
  return a.end === b.start || b.end === a.start;
}

/**
 * Checks whether an interval is completely contained within an availability window.
 * Rule: window.start <= interval.start && interval.end <= window.end
 * 
 * @param {Object} interval 
 * @param {Object} window 
 * @returns {boolean} True if the interval fits entirely inside the window
 */
export function isIntervalWithinWindow(interval, window) {
  const intv = normalizeInterval(interval, 'Target Interval');
  const win = normalizeInterval(window, 'Availability Window');
  return win.start <= intv.start && intv.end <= win.end;
}

/**
 * Computes the gap distance between two disjoint intervals.
 * - If intervalA is before intervalB: gap = intervalB.start - intervalA.end.
 * - If intervalB is before intervalA: gap = intervalA.start - intervalB.end.
 * - If intervals overlap, returns a negative number representing overlap length.
 * 
 * @param {Object} intervalA 
 * @param {Object} intervalB 
 * @returns {number} Separation distance (or negative overlap length)
 */
export function getIntervalGap(intervalA, intervalB) {
  const a = normalizeInterval(intervalA, 'Interval A');
  const b = normalizeInterval(intervalB, 'Interval B');

  if (a.end <= b.start) {
    return b.start - a.end;
  }
  if (b.end <= a.start) {
    return a.start - b.end;
  }
  // Overlapping
  const overlapStart = Math.max(a.start, b.start);
  const overlapEnd = Math.min(a.end, b.end);
  return -(overlapEnd - overlapStart);
}

/**
 * Evaluates whether two assignments assigned to the same resource violate the required separation buffer.
 * 
 * Buffer Enforcement Rule:
 * 1. If intervalA and intervalB overlap, this is an immediate overlap AND buffer violation.
 * 2. If intervalA and intervalB are disjoint, the separation gap between them must be >= bufferDuration.
 *    If getIntervalGap(intervalA, intervalB) < bufferDuration, returns true (violation).
 * 
 * Note: A buffer of 0 is equivalent to an ordinary non-overlap check.
 * 
 * @param {Object} intervalA 
 * @param {Object} intervalB 
 * @param {number} bufferDuration - Minimum required separation units (minutes or milliseconds, matching interval units)
 * @returns {boolean} True if there is a buffer violation
 */
export function hasBufferViolation(intervalA, intervalB, bufferDuration = 0) {
  if (typeof bufferDuration !== 'number' || Number.isNaN(bufferDuration) || bufferDuration < 0) {
    throw new RangeError(`Buffer duration must be a non-negative number, received ${bufferDuration}`);
  }

  const a = normalizeInterval(intervalA, 'Interval A');
  const b = normalizeInterval(intervalB, 'Interval B');

  // Any direct overlap is also an inherent buffer violation
  if (a.start < b.end && b.start < a.end) {
    return true;
  }

  // Check separation gap
  const gap = getIntervalGap(a, b);
  return gap < bufferDuration;
}

/**
 * Chronological comparator for sorting half-open intervals.
 * Sorts primarily by start time ascending, then by end time ascending.
 * 
 * @param {Object} intervalA 
 * @param {Object} intervalB 
 * @returns {number}
 */
export function compareIntervals(intervalA, intervalB) {
  const a = normalizeInterval(intervalA, 'Interval A');
  const b = normalizeInterval(intervalB, 'Interval B');
  if (a.start !== b.start) {
    return a.start - b.start;
  }
  return a.end - b.end;
}
