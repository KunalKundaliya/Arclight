/**
 * ArcLight - Stage 5 Soft-Constraint Evaluator & Multi-Objective Scoring Engine
 * 
 * Evaluates the quality of a feasible interview schedule across multiple
 * competing optimization dimensions:
 * 1. Workload Balancing: Minimizes faculty interview load variance and max-min spread.
 * 2. Fatigue Prevention: Penalizes long consecutive interview stretches without extended breaks.
 * 3. Schedule Compactness: Minimizes fragmented, awkward idle lulls in faculty daily schedules.
 * 4. Room Stability: Reduces unnecessary chamber switching for consecutive interviewer sessions.
 * 5. Skill Affinity: Maximizes domain alignment and depth between candidate and panel skills.
 * 
 * Provides detailed penalty telemetry and a normalized composite fitness score (0 - 100).
 */

import { parseTimeString } from './TimezoneUtils.js';
import { getIntervalGap } from './IntervalUtils.js';

export const DEFAULT_OBJECTIVE_WEIGHTS = Object.freeze({
  workloadBalance: 0.30,
  fatiguePrevention: 0.25,
  scheduleCompactness: 0.15,
  roomStability: 0.15,
  skillAffinity: 0.15
});

/**
 * Normalizes start and end minute offsets for an assignment.
 * @param {Object} assignment
 * @returns {{ start: number, end: number, duration: number }}
 */
function getAssignmentMinutes(assignment) {
  const start = typeof assignment.startMinutes === 'number'
    ? assignment.startMinutes
    : (typeof assignment.startMinuteOfDay === 'number'
      ? assignment.startMinuteOfDay
      : parseTimeString(assignment.startTime).totalMinutes);

  const end = typeof assignment.endMinutes === 'number'
    ? assignment.endMinutes
    : (typeof assignment.endMinuteOfDay === 'number'
      ? assignment.endMinuteOfDay
      : parseTimeString(assignment.endTime).totalMinutes);

  return {
    start,
    end,
    duration: end - start
  };
}

export class SoftConstraintEvaluator {
  /**
   * 1. Evaluates Faculty Workload Balance
   * Minimizes variance and spread in interviews assigned across active faculty.
   * 
   * @param {Array<Object>} assignments
   * @param {Object} context
   * @returns {{ score: number, penalty: number, metrics: Object }}
   */
  static evaluateWorkloadBalance(assignments = [], context = {}) {
    const interviewers = context.interviewers || [];
    if (!Array.isArray(interviewers) || interviewers.length === 0) {
      return { score: 100, penalty: 0, metrics: { totalInterviewers: 0, stdDev: 0, spread: 0 } };
    }

    // Filter to active interviewers (exclude On Leave)
    const activeInterviewers = interviewers.filter(i => i.status !== 'On Leave');
    if (activeInterviewers.length === 0) {
      return { score: 100, penalty: 0, metrics: { totalInterviewers: 0, stdDev: 0, spread: 0 } };
    }

    const counts = new Map(activeInterviewers.map(i => [i.id, 0]));

    for (const a of assignments) {
      const rawIds = a.interviewerIds || a.interviewer_ids || (a.interviewerId ? [a.interviewerId] : []);
      for (const id of rawIds) {
        if (counts.has(id)) {
          counts.set(id, counts.get(id) + 1);
        }
      }
    }

    const countVals = Array.from(counts.values());
    const totalAssigned = countVals.reduce((sum, v) => sum + v, 0);
    const mean = totalAssigned / countVals.length;

    const variance = countVals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / countVals.length;
    const stdDev = Math.sqrt(variance);
    const minCount = Math.min(...countVals);
    const maxCount = Math.max(...countVals);
    const spread = maxCount - minCount;

    // Penalty scales with standard deviation and spread beyond inevitable discrete rounding (spread - 1)
    const excessSpread = Math.max(0, spread - 1);
    const penalty = Number((stdDev * 6 + excessSpread * 4).toFixed(2));
    // Score out of 100
    const score = Number(Math.max(0, Math.min(100, 100 - (penalty * 2.5))).toFixed(1));

    return {
      score,
      penalty,
      metrics: {
        totalActiveInterviewers: activeInterviewers.length,
        meanWorkload: Number(mean.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        minAssigned: minCount,
        maxAssigned: maxCount,
        spread
      }
    };
  }

  /**
   * 2. Evaluates Interviewer Fatigue & Rest
   * Penalizes back-to-back sessions (>= 3 without a >= 30m break) and excessive single-day spans.
   * 
   * @param {Array<Object>} assignments
   * @param {Object} context
   * @returns {{ score: number, penalty: number, metrics: Object }}
   */
  static evaluateInterviewerFatigue(assignments = [], context = {}) {
    if (!assignments || assignments.length === 0) {
      return { score: 100, penalty: 0, metrics: { backToBackRuns: 0, longStretches: 0 } };
    }

    // Group assignments by interviewer and date: `${intvId}_${date}` -> Array<Assignment>
    const grouped = new Map();

    for (const a of assignments) {
      const rawIds = a.interviewerIds || a.interviewer_ids || (a.interviewerId ? [a.interviewerId] : []);
      for (const intvId of rawIds) {
        const key = `${intvId}_${a.date}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(a);
      }
    }

    let totalPenalty = 0;
    let backToBackCount = 0;
    let excessiveStretchCount = 0;

    for (const [, sessions] of grouped.entries()) {
      if (sessions.length <= 1) continue;

      // Sort sessions chronologically
      const sorted = sessions.slice().sort((a, b) => {
        const mA = getAssignmentMinutes(a);
        const mB = getAssignmentMinutes(b);
        return mA.start - mB.start;
      });

      let currentConsecutiveBlock = 1;

      for (let i = 0; i < sorted.length - 1; i++) {
        const curMin = getAssignmentMinutes(sorted[i]);
        const nextMin = getAssignmentMinutes(sorted[i + 1]);
        const gap = nextMin.start - curMin.end;

        if (gap < 30) {
          // Less than 30 minutes rest between sessions
          currentConsecutiveBlock++;
          if (currentConsecutiveBlock === 2) {
            // 2 consecutive sessions: mild penalty
            totalPenalty += 2;
            backToBackCount++;
          } else if (currentConsecutiveBlock >= 3) {
            // 3 or more consecutive sessions: compounding fatigue penalty
            totalPenalty += 8 + (currentConsecutiveBlock - 3) * 4;
            excessiveStretchCount++;
          }
        } else {
          // Received a healthy rest break (>= 30 mins)
          currentConsecutiveBlock = 1;
        }
      }

      // Check total daily working span without a major rest break (>= 45m)
      const firstStart = getAssignmentMinutes(sorted[0]).start;
      const lastEnd = getAssignmentMinutes(sorted[sorted.length - 1]).end;
      const totalSpan = lastEnd - firstStart;

      if (totalSpan > 300) { // > 5 hours
        const hasMajorBreak = sorted.some((s, idx) => {
          if (idx === sorted.length - 1) return false;
          const next = sorted[idx + 1];
          return (getAssignmentMinutes(next).start - getAssignmentMinutes(s).end) >= 45;
        });

        if (!hasMajorBreak) {
          totalPenalty += 10;
          excessiveStretchCount++;
        }
      }
    }

    const penalty = Number(totalPenalty.toFixed(2));
    const score = Number(Math.max(0, Math.min(100, 100 - (penalty * 3))).toFixed(1));

    return {
      score,
      penalty,
      metrics: {
        backToBackRuns: backToBackCount,
        longStretches: excessiveStretchCount,
        rawFatiguePenalty: totalPenalty
      }
    };
  }

  /**
   * 3. Evaluates Schedule Compactness & Idle Time
   * Penalizes awkward, fragmented faculty waiting gaps (> 90m and < 240m) on a single day.
   * 
   * @param {Array<Object>} assignments
   * @param {Object} context
   * @returns {{ score: number, penalty: number, metrics: Object }}
   */
  static evaluateScheduleCompactness(assignments = [], context = {}) {
    if (!assignments || assignments.length === 0) {
      return { score: 100, penalty: 0, metrics: { fragmentedGapsCount: 0, totalWastedMinutes: 0 } };
    }

    const grouped = new Map();

    for (const a of assignments) {
      const rawIds = a.interviewerIds || a.interviewer_ids || (a.interviewerId ? [a.interviewerId] : []);
      for (const intvId of rawIds) {
        const key = `${intvId}_${a.date}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(a);
      }
    }

    let totalPenalty = 0;
    let fragmentedGaps = 0;
    let wastedMinutes = 0;

    for (const [, sessions] of grouped.entries()) {
      if (sessions.length <= 1) continue;

      const sorted = sessions.slice().sort((a, b) => {
        return getAssignmentMinutes(a).start - getAssignmentMinutes(b).start;
      });

      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = getAssignmentMinutes(sorted[i + 1]).start - getAssignmentMinutes(sorted[i]).end;

        // An idle gap between 90m (1.5h) and 240m (4h) fragments an interviewer's day
        // without leaving enough time to productively leave campus or start deep work
        if (gap >= 90 && gap <= 240) {
          fragmentedGaps++;
          wastedMinutes += gap;
          totalPenalty += (gap / 30) * 3; // ~9 to 24 points penalty
        }
      }
    }

    const penalty = Number(totalPenalty.toFixed(2));
    const score = Number(Math.max(0, Math.min(100, 100 - (penalty * 2))).toFixed(1));

    return {
      score,
      penalty,
      metrics: {
        fragmentedGapsCount: fragmentedGaps,
        totalWastedMinutes: wastedMinutes
      }
    };
  }

  /**
   * 4. Evaluates Room Stability / Chamber Hopping Reduction
   * Penalizes an interviewer switching rooms between consecutive interviews on the same day.
   * 
   * @param {Array<Object>} assignments
   * @param {Object} context
   * @returns {{ score: number, penalty: number, metrics: Object }}
   */
  static evaluateRoomStability(assignments = [], context = {}) {
    if (!assignments || assignments.length === 0) {
      return { score: 100, penalty: 0, metrics: { roomSwitchesCount: 0 } };
    }

    const grouped = new Map();

    for (const a of assignments) {
      const rawIds = a.interviewerIds || a.interviewer_ids || (a.interviewerId ? [a.interviewerId] : []);
      for (const intvId of rawIds) {
        const key = `${intvId}_${a.date}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(a);
      }
    }

    let roomSwitches = 0;
    let totalPenalty = 0;

    for (const [, sessions] of grouped.entries()) {
      if (sessions.length <= 1) continue;

      const sorted = sessions.slice().sort((a, b) => {
        return getAssignmentMinutes(a).start - getAssignmentMinutes(b).start;
      });

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const gap = getAssignmentMinutes(next).start - getAssignmentMinutes(current).end;

        // If the gap between interviews is <= 45 minutes and rooms differ,
        // the faculty member has to rush and change physical chambers
        if (gap <= 45 && current.roomId && next.roomId && current.roomId !== next.roomId) {
          roomSwitches++;
          totalPenalty += 6;
        }
      }
    }

    const penalty = Number(totalPenalty.toFixed(2));
    const score = Number(Math.max(0, Math.min(100, 100 - (penalty * 3.5))).toFixed(1));

    return {
      score,
      penalty,
      metrics: {
        roomSwitchesCount: roomSwitches
      }
    };
  }

  /**
   * 5. Evaluates Candidate-Panel Skill Affinity & Depth
   * Rewards panels whose specialized skills cover and exceed candidate needs.
   * 
   * @param {Array<Object>} assignments
   * @param {Object} context
   * @returns {{ score: number, penalty: number, metrics: Object }}
   */
  static evaluateSkillAffinity(assignments = [], context = {}) {
    if (!assignments || assignments.length === 0) {
      return { score: 100, penalty: 0, metrics: { averageAffinityRatio: 1 } };
    }

    const candidateMap = new Map((context.candidates || []).map(c => [c.id, c]));
    const interviewerMap = new Map((context.interviewers || []).map(i => [i.id, i]));

    let totalAffinitySum = 0;
    let totalEvaluated = 0;

    for (const a of assignments) {
      const candObj = a.candidate || candidateMap.get(a.candidateId);
      const candSkills = candObj && Array.isArray(candObj.skills) ? candObj.skills : [];

      if (candSkills.length === 0) {
        totalAffinitySum += 1.0;
        totalEvaluated++;
        continue;
      }

      // Collect all skills present on the assigned panel
      const rawIds = a.interviewerIds || a.interviewer_ids || (a.interviewerId ? [a.interviewerId] : []);
      const panelSkills = new Set();

      for (const id of rawIds) {
        const intvObj = interviewerMap.get(id);
        if (intvObj && Array.isArray(intvObj.skills)) {
          intvObj.skills.forEach(s => panelSkills.add(s.trim().toLowerCase()));
        }
      }

      // Calculate overlap with candidate skills
      const normalizedCandSkills = candSkills.map(s => s.trim().toLowerCase());
      const matched = normalizedCandSkills.filter(s => {
        if (panelSkills.has(s)) return true;
        for (const ps of panelSkills) {
          if (ps.includes(s) || s.includes(ps)) return true;
          if (s.includes('system') && ps.includes('system')) return true;
          if (s.includes('design') && (ps.includes('architect') || ps.includes('design'))) return true;
          if (s.includes('architect') && (ps.includes('design') || ps.includes('architect'))) return true;
          if (s.includes('distribut') && ps.includes('distribut')) return true;
          if ((s.includes('consensus') || s.includes('raft') || s.includes('paxos')) && (ps.includes('consensus') || ps.includes('raft') || ps.includes('fault'))) return true;
          if ((s.includes('cloud') || s.includes('infra') || s.includes('k8s') || s.includes('kubernetes')) && (ps.includes('cloud') || ps.includes('kubernetes') || ps.includes('terraform') || ps.includes('linux'))) return true;
        }
        return false;
      });
      let affinityRatio = 0;
      if (normalizedCandSkills.length === 0) {
        affinityRatio = 1.0;
      } else if (matched.length >= 2) {
        affinityRatio = 1.0;
      } else if (matched.length === 1) {
        affinityRatio = 0.85;
      } else {
        const isDomainAssessor = Array.from(panelSkills).some(ps =>
          ps.includes('system') || ps.includes('architect') || ps.includes('design') || ps.includes('distribut')
        );
        affinityRatio = isDomainAssessor ? 0.70 : 0.0;
      }

      totalAffinitySum += affinityRatio;
      totalEvaluated++;
    }

    const avgAffinity = totalEvaluated > 0 ? (totalAffinitySum / totalEvaluated) : 1;
    const score = Number((avgAffinity * 100).toFixed(1));
    const penalty = Number(((1 - avgAffinity) * 30).toFixed(2));

    return {
      score,
      penalty,
      metrics: {
        averageAffinityRatio: Number(avgAffinity.toFixed(3)),
        totalEvaluated
      }
    };
  }

  /**
   * Evaluates a complete schedule across all 5 soft-constraint objective dimensions.
   * 
   * @param {Array<Object>} assignments
   * @param {Object} [context={}]
   * @param {Object} [weights=DEFAULT_OBJECTIVE_WEIGHTS]
   * @returns {{
   *   fitnessScore: number,
   *   totalPenalty: number,
   *   breakdown: Object,
   *   grade: string
   * }}
   */
  static evaluateSchedule(assignments = [], context = {}, weights = DEFAULT_OBJECTIVE_WEIGHTS) {
    const w = { ...DEFAULT_OBJECTIVE_WEIGHTS, ...weights };

    const balanceRes = this.evaluateWorkloadBalance(assignments, context);
    const fatigueRes = this.evaluateInterviewerFatigue(assignments, context);
    const compactnessRes = this.evaluateScheduleCompactness(assignments, context);
    const roomStabilityRes = this.evaluateRoomStability(assignments, context);
    const affinityRes = this.evaluateSkillAffinity(assignments, context);

    // Weighted composite fitness score (0 - 100)
    const compositeFitness = (
      balanceRes.score * w.workloadBalance +
      fatigueRes.score * w.fatiguePrevention +
      compactnessRes.score * w.scheduleCompactness +
      roomStabilityRes.score * w.roomStability +
      affinityRes.score * w.skillAffinity
    );

    // Weighted composite penalty
    const compositePenalty = (
      balanceRes.penalty * w.workloadBalance +
      fatigueRes.penalty * w.fatiguePrevention +
      compactnessRes.penalty * w.scheduleCompactness +
      roomStabilityRes.penalty * w.roomStability +
      affinityRes.penalty * w.skillAffinity
    );

    const fitnessScore = Number(Math.max(0, Math.min(100, compositeFitness)).toFixed(1));
    const totalPenalty = Number(compositePenalty.toFixed(2));

    let grade = 'A+';
    if (fitnessScore < 60) grade = 'F';
    else if (fitnessScore < 70) grade = 'D';
    else if (fitnessScore < 80) grade = 'C';
    else if (fitnessScore < 90) grade = 'B';
    else if (fitnessScore < 95) grade = 'A';

    return {
      fitnessScore,
      totalPenalty,
      grade,
      breakdown: {
        workloadBalance: balanceRes,
        fatiguePrevention: fatigueRes,
        scheduleCompactness: compactnessRes,
        roomStability: roomStabilityRes,
        skillAffinity: affinityRes
      },
      weights: w
    };
  }
}
