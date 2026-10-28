/**
 * ArcLight - CSP Variable Representation
 * 
 * Represents an interview session variable in the Constraint Satisfaction Problem (CSP).
 * Each variable corresponds to a specific interview round required for a candidate.
 * 
 * Architectural Responsibilities:
 * - Represents the CSP variable: X_i = (candidate, round)
 * - Encapsulates domain values: D_i = { (slot, panel, room)_1, (slot, panel, room)_2, ... }
 * - Tracks variable assignment state during search
 * - Maintains a reversible pruning stack for forward-checking and chronological backtracking
 * - Exports standard assignment representations compatible with Stage 3 ConstraintValidator
 */

import { DomainValue } from './DomainValue.js';

export class CspVariable {
  /**
   * @param {Object} options
   * @param {string} [options.id] - Unique variable identifier (e.g. 'var-cand-01-r1')
   * @param {string} options.candidateId - ID of the candidate
   * @param {Object} [options.candidate=null] - Candidate entity
   * @param {string|number} [options.roundId=1] - Round identifier
   * @param {string} [options.roundName='Interview'] - Name of the interview round
   * @param {number} [options.durationMinutes=45] - Expected interview duration
   * @param {string[]} [options.requiredSkills=[]] - Required technical skills for the interview panel
   * @param {number} [options.panelSize=1] - Number of interviewers required on the panel
   * @param {string|null} [options.requiredRoomType=null] - Required room type (e.g. 'Physical', 'Virtual Hub')
   * @param {string[]} [options.requiredEquipment=[]] - Required room hardware/equipment
   * @param {number} [options.priority=1] - Scheduling priority tier
   * @param {DomainValue[]} [options.domain=[]] - Initial active domain values
   */
  constructor({
    id,
    candidateId,
    candidate = null,
    roundId = 'r1',
    roundName = 'Technical Screen',
    durationMinutes = 45,
    requiredSkills = [],
    panelSize = 1,
    requiredRoomType = null,
    requiredEquipment = [],
    priority = 1,
    domain = []
  }) {
    if (!candidateId) throw new TypeError('CspVariable: candidateId is required');

    this.id = id || `var-${candidateId}-${roundId}`;
    this.candidateId = candidateId;
    this.candidate = candidate || { id: candidateId, name: `Candidate ${candidateId}` };
    this.roundId = roundId;
    this.roundName = roundName;
    this.durationMinutes = Number(durationMinutes) || 45;
    this.requiredSkills = Array.isArray(requiredSkills) ? [...requiredSkills] : [];
    this.panelSize = Math.max(1, Number(panelSize) || 1);
    this.requiredRoomType = requiredRoomType || null;
    this.requiredEquipment = Array.isArray(requiredEquipment) ? [...requiredEquipment] : [];
    this.priority = Number(priority) || 1;

    // Active domain values
    this.domain = Array.isArray(domain) ? [...domain] : [];
    this.initialDomainSize = this.domain.length;

    // Current assigned value during search
    this.assignedValue = null;

    // Reversible backtrack history stack: [{ value: DomainValue, level: number, reason: string }]
    this.pruneStack = [];

    // Diagnostics / root-cause tracking if domain is empty or unsatisfiable
    this.diagnostics = [];
  }

  /**
   * Whether this variable has been assigned a concrete value.
   * @returns {boolean}
   */
  isAssigned() {
    return this.assignedValue !== null;
  }

  /**
   * Assigns a domain value to this variable.
   * @param {DomainValue} domainValue
   */
  assign(domainValue) {
    if (!domainValue) {
      throw new TypeError('CspVariable.assign: domainValue cannot be null or undefined');
    }
    this.assignedValue = domainValue;
  }

  /**
   * Unassigns the current value (used when backtracking).
   */
  unassign() {
    this.assignedValue = null;
  }

  /**
   * Returns the count of remaining active domain values.
   * @returns {number}
   */
  getDomainSize() {
    return this.domain.length;
  }

  /**
   * Returns a copy of the current active domain values.
   * @returns {DomainValue[]}
   */
  getRemainingDomain() {
    return [...this.domain];
  }

  /**
   * Whether this variable has run out of domain values and cannot be satisfied.
   * @returns {boolean}
   */
  isUnsatisfiable() {
    return !this.isAssigned() && this.domain.length === 0;
  }

  /**
   * Sets the initial domain values and records initial domain size.
   * @param {DomainValue[]} values
   */
  setInitialDomain(values) {
    this.domain = Array.isArray(values) ? [...values] : [];
    this.initialDomainSize = this.domain.length;
    this.pruneStack = [];
  }

  /**
   * Prunes a specific domain value by its ID at a given backtrack search level.
   * 
   * @param {string} valueId - Identifier of the domain value to prune
   * @param {number} [level=0] - Current depth/level in the search tree
   * @param {string} [reason=''] - Diagnostic reason for pruning
   * @returns {boolean} True if the value was found and pruned, false otherwise
   */
  pruneValue(valueId, level = 0, reason = '') {
    const idx = this.domain.findIndex(v => v.id === valueId);
    if (idx === -1) return false;

    const [removedValue] = this.domain.splice(idx, 1);
    this.pruneStack.push({
      value: removedValue,
      level,
      reason
    });
    return true;
  }

  /**
   * Prunes all values matching a predicate.
   * 
   * @param {function(DomainValue): boolean} predicate
   * @param {number} [level=0]
   * @param {string} [reason='']
   * @returns {number} Count of values pruned
   */
  pruneWhere(predicate, level = 0, reason = '') {
    let prunedCount = 0;
    for (let i = this.domain.length - 1; i >= 0; i--) {
      const val = this.domain[i];
      if (predicate(val)) {
        this.domain.splice(i, 1);
        this.pruneStack.push({
          value: val,
          level,
          reason
        });
        prunedCount++;
      }
    }
    return prunedCount;
  }

  /**
   * Restores all values pruned at or above the specified search level.
   * Called during chronological backtracking.
   * 
   * @param {number} level - Backtrack search level
   * @returns {number} Count of restored domain values
   */
  restoreLevel(level) {
    let restoredCount = 0;
    const remainingInStack = [];

    for (const entry of this.pruneStack) {
      if (entry.level >= level) {
        this.domain.push(entry.value);
        restoredCount++;
      } else {
        remainingInStack.push(entry);
      }
    }

    this.pruneStack = remainingInStack;
    return restoredCount;
  }

  /**
   * Restores all pruned values unconditionally (resets domain).
   */
  restoreAll() {
    while (this.pruneStack.length > 0) {
      const entry = this.pruneStack.pop();
      this.domain.push(entry.value);
    }
  }

  /**
   * Formats this variable and a domain value into a standardized assignment object
   * directly compatible with Stage 3 ConstraintValidator.validateAssignment().
   * 
   * @param {DomainValue} [domainValue=this.assignedValue]
   * @returns {Object}
   */
  toAssignment(domainValue = this.assignedValue) {
    if (!domainValue) {
      throw new Error(`CspVariable.toAssignment: Variable "${this.id}" has no assigned value and no domainValue was provided`);
    }

    return {
      id: `prop-intv-${this.candidateId}-${this.roundId}`,
      variableId: this.id,
      candidateId: this.candidateId,
      candidate: this.candidate,
      candidateName: this.candidate.name || `Candidate ${this.candidateId}`,
      candidateRole: this.candidate.appliedRole || 'Software Development Engineer',
      roundId: this.roundId,
      roundTitle: this.roundName,
      roundType: this.roundName,
      date: domainValue.date,
      startTime: domainValue.startTime,
      endTime: domainValue.endTime,
      durationMinutes: this.durationMinutes,
      interviewerIds: [...domainValue.interviewerIds],
      interviewers: [...domainValue.interviewers],
      roomId: domainValue.roomId,
      room: domainValue.room,
      requiredSkills: [...this.requiredSkills],
      requiredRoomType: this.requiredRoomType,
      requiredEquipment: [...this.requiredEquipment],
      panelSize: this.panelSize
    };
  }
}
