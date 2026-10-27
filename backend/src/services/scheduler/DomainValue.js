/**
 * ArcLight - CSP Domain Value Representation
 * 
 * Represents an atomic assignment value in the domain of a CSP Variable.
 * A DomainValue binds:
 * - A discrete half-open time slot [startTime, endTime) on a specific calendar date.
 * - An interviewer panel (one or more interviewers meeting required skills and panel size).
 * - An interview room (meeting capacity, type, and equipment requirements).
 * 
 * Includes metadata and penalty/cost weighting for heuristic value ordering (e.g. LCV).
 */

import { parseTimeString } from './TimezoneUtils.js';

export class DomainValue {
  /**
   * @param {Object} options
   * @param {string} [options.id] - Optional explicit identifier. Generated automatically if omitted.
   * @param {string} options.date - 'YYYY-MM-DD'
   * @param {string} options.startTime - 'HH:mm'
   * @param {string} options.endTime - 'HH:mm'
   * @param {number} [options.startMinutes] - Minute-of-day offset (0-1439)
   * @param {number} [options.endMinutes] - Minute-of-day offset (0-1439)
   * @param {string[]} options.interviewerIds - List of interviewer IDs
   * @param {Array<Object>} [options.interviewers=[]] - List of resolved interviewer objects
   * @param {string} options.roomId - Room identifier
   * @param {Object} [options.room=null] - Resolved room object
   * @param {Object} [options.slot=null] - Original slot descriptor
   * @param {number} [options.cost=0] - Heuristic cost or contention score (used by LCV)
   */
  constructor({
    id,
    date,
    startTime,
    endTime,
    startMinutes,
    endMinutes,
    interviewerIds = [],
    interviewers = [],
    roomId,
    room = null,
    slot = null,
    cost = 0
  }) {
    if (!date) throw new TypeError('DomainValue: date is required');
    if (!startTime || !endTime) throw new TypeError('DomainValue: startTime and endTime are required');
    if (!Array.isArray(interviewerIds) || interviewerIds.length === 0) {
      throw new TypeError('DomainValue: interviewerIds must be a non-empty array');
    }
    if (!roomId) throw new TypeError('DomainValue: roomId is required');

    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;

    if (startMinutes !== undefined) {
      this.startMinutes = Number(startMinutes);
    } else {
      try {
        this.startMinutes = parseTimeString(startTime).totalMinutes;
      } catch (_) {
        this.startMinutes = 0;
      }
    }

    if (endMinutes !== undefined) {
      this.endMinutes = Number(endMinutes);
    } else {
      try {
        this.endMinutes = parseTimeString(endTime).totalMinutes;
      } catch (_) {
        this.endMinutes = 0;
      }
    }

    this.interviewerIds = [...interviewerIds];
    this.interviewers = Array.isArray(interviewers) ? [...interviewers] : [];
    this.roomId = roomId;
    this.room = room;
    this.slot = slot;
    this.cost = Number(cost) || 0;

    // Stable deterministic identifier for indexing and pruning
    this.id = id || `${date}_${startTime}_${this.interviewerIds.slice().sort().join('-')}_${roomId}`;
  }

  /**
   * Checks whether this domain value overlaps in time with another domain value on the same date.
   * Uses half-open interval semantics [start, end).
   * @param {DomainValue|Object} other
   * @returns {boolean}
   */
  overlaps(other) {
    if (!other || this.date !== other.date) return false;
    const s1 = this.startMinutes;
    const e1 = this.endMinutes;
    const s2 = other.startMinutes !== undefined ? other.startMinutes : parseTimeString(other.startTime).totalMinutes;
    const e2 = other.endMinutes !== undefined ? other.endMinutes : parseTimeString(other.endTime).totalMinutes;
    return s1 < e2 && s2 < e1;
  }

  /**
   * Checks whether this domain value shares any interviewer with another domain value.
   * @param {DomainValue|Object} other
   * @returns {boolean}
   */
  sharesInterviewer(other) {
    if (!other || !Array.isArray(other.interviewerIds)) return false;
    return this.interviewerIds.some(id => other.interviewerIds.includes(id));
  }

  /**
   * Checks whether this domain value uses the same room as another domain value.
   * @param {DomainValue|Object} other
   * @returns {boolean}
   */
  sharesRoom(other) {
    if (!other || !other.roomId) return false;
    return this.roomId === other.roomId;
  }

  /**
   * Returns a compact summary string for logging and telemetry.
   * @returns {string}
   */
  toString() {
    return `[${this.date} ${this.startTime}-${this.endTime} | Panel: ${this.interviewerIds.join(',')} | Room: ${this.roomId}]`;
  }
}
