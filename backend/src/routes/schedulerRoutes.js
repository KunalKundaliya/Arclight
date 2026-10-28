import { Router } from 'express';
import { BackendSchedulerEngine } from '../services/schedulerEngine.js';
import { dbService } from '../services/dbService.js';
import {
  SchedulePersistenceService,
  DynamicRepairEngine
} from '../services/scheduler/index.js';

const router = Router();

// =============================================================================
// 1. SOLVE RECRUITMENT DRIVE (CSP Backtracking + Soft-Constraint Optimization)
// =============================================================================
router.post('/solve', async (req, res) => {
  try {
    const {
      driveId = 'drv-101',
      roundName = 'System Architecture',
      startDate = '2026-11-02',
      endDate = '2026-11-06',
      durationMinutes = 45,
      bufferMinutes = 15,
      applyToDatabase = false,
      applyImmediately = false,
      replaceExisting = false,
      options = {}
    } = req.body;

    const allCandidates = await dbService.getCandidates();
    const interviewers = await dbService.getInterviewers();
    const rooms = await dbService.getRooms();

    // Filter candidates for this drive if applicable, or take all
    const driveCandidates = allCandidates.filter(c => !driveId || c.driveId === driveId || !c.driveId);
    const candidatesToSchedule = driveCandidates.length > 0 ? driveCandidates : allCandidates;

    const result = BackendSchedulerEngine.solve({
      driveId,
      roundName,
      startDate,
      endDate,
      durationMinutes,
      bufferMinutes,
      candidates: candidatesToSchedule,
      interviewers,
      rooms,
      options
    });

    const shouldApply = applyToDatabase || applyImmediately;
    let persistenceResult = null;

    if (shouldApply && result.assignments?.length) {
      persistenceResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId,
        assignments: result.assignments,
        options: {
          replaceExistingForDrive: replaceExisting,
          notify: true
        }
      });

      if (!persistenceResult.success) {
        return res.status(persistenceResult.reason === 'CONCURRENCY_COLLISION' ? 409 : 500).json({
          success: false,
          message: persistenceResult.error || 'Failed to safely persist schedule',
          solverResult: result,
          persistence: persistenceResult
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        persisted: Boolean(persistenceResult?.success),
        persistenceDetails: persistenceResult
      }
    });
  } catch (error) {
    console.error('Error during CSP solver run:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute constraint-satisfaction solver',
      error: error.message
    });
  }
});

// =============================================================================
// 2. TRANSACTIONAL APPLY (Atomic Commit with Concurrency Checks & Rollback)
// =============================================================================
router.post('/apply', async (req, res) => {
  try {
    const {
      driveId,
      assignments,
      options = {}
    } = req.body;

    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: 'driveId is required to apply schedule transaction'
      });
    }

    let targetAssignments = assignments;

    // If assignments were not provided, solve first and then apply
    if (!Array.isArray(targetAssignments) || targetAssignments.length === 0) {
      const allCandidates = await dbService.getCandidates();
      const interviewers = await dbService.getInterviewers();
      const rooms = await dbService.getRooms();

      const solveResult = BackendSchedulerEngine.solve({
        driveId,
        candidates: allCandidates.filter(c => !c.driveId || c.driveId === driveId),
        interviewers,
        rooms,
        options
      });

      targetAssignments = solveResult.assignments || [];
    }

    if (targetAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No assignments available to apply'
      });
    }

    const result = await SchedulePersistenceService.applyScheduleTransaction({
      driveId,
      assignments: targetAssignments,
      options
    });

    if (!result.success) {
      const statusCode = result.reason === 'CONCURRENCY_COLLISION' ? 409 : 500;
      return res.status(statusCode).json({
        success: false,
        message: result.error,
        details: result
      });
    }

    res.json({
      success: true,
      message: `Successfully and safely persisted ${result.appliedCount} interview sessions`,
      data: result
    });
  } catch (error) {
    console.error('Error applying schedule transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply schedule transaction',
      error: error.message
    });
  }
});

// =============================================================================
// 3. SCHEDULE ROLLBACK (Safe Undo / Administrative Reset)
// =============================================================================
router.post('/rollback', async (req, res) => {
  try {
    const {
      driveId,
      interviewIds,
      reason = 'Administrative schedule rollback',
      hardDelete = false
    } = req.body;

    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: 'driveId is required for rollback'
      });
    }

    const result = await SchedulePersistenceService.rollbackSchedule({
      driveId,
      interviewIds,
      reason,
      hardDelete
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
        details: result
      });
    }

    res.json({
      success: true,
      message: `Successfully rolled back ${result.rolledBackCount} interview sessions`,
      data: result
    });
  } catch (error) {
    console.error('Error during schedule rollback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback schedule',
      error: error.message
    });
  }
});

// =============================================================================
// 4. REAL-TIME SCHEDULE STATUS & FULFILLMENT METRICS
// =============================================================================
router.get('/status/:driveId', async (req, res) => {
  try {
    const { driveId } = req.params;
    const status = await SchedulePersistenceService.getScheduleStatus({ driveId });
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error retrieving schedule status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule status',
      error: error.message
    });
  }
});

// =============================================================================
// 5. STAGE 8 DYNAMIC RESCHEDULING REPAIRS
// =============================================================================

// 5.1 Faculty Call-Out Repair (Tier 1 Substitute Assessor, Tier 2 Slot Shift)
router.post('/reschedule/faculty-callout', async (req, res) => {
  try {
    const {
      driveId = 'drv-101',
      unavailableInterviewerId,
      date,
      timeRange,
      applyImmediately = false
    } = req.body;

    if (!unavailableInterviewerId || !date) {
      return res.status(400).json({
        success: false,
        message: 'unavailableInterviewerId and date are required'
      });
    }

    const [interviews, candidates, interviewers, rooms] = await Promise.all([
      dbService.getInterviews(),
      dbService.getCandidates(),
      dbService.getInterviewers(),
      dbService.getRooms()
    ]);

    const repairResult = DynamicRepairEngine.repairFacultyCallOut({
      schedule: interviews.filter(i => !driveId || i.driveId === driveId),
      unavailableInterviewerId,
      date,
      timeRange,
      context: { candidates, interviewers, rooms }
    });

    let persistenceResult = null;
    if (applyImmediately && repairResult.success && repairResult.schedule?.length) {
      persistenceResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId,
        assignments: repairResult.schedule,
        options: { replaceExistingForDrive: true }
      });
    }

    res.json({
      success: repairResult.success,
      data: {
        ...repairResult,
        persisted: Boolean(persistenceResult?.success),
        persistenceDetails: persistenceResult
      }
    });
  } catch (error) {
    console.error('Error during faculty call-out repair:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process faculty call-out repair',
      error: error.message
    });
  }
});

// 5.2 Chamber Emergency Outage Repair (Chamber Migration)
router.post('/reschedule/room-outage', async (req, res) => {
  try {
    const {
      driveId = 'drv-101',
      offlineRoomId,
      date,
      timeRange,
      applyImmediately = false
    } = req.body;

    if (!offlineRoomId || !date) {
      return res.status(400).json({
        success: false,
        message: 'offlineRoomId and date are required'
      });
    }

    const [interviews, candidates, interviewers, rooms] = await Promise.all([
      dbService.getInterviews(),
      dbService.getCandidates(),
      dbService.getInterviewers(),
      dbService.getRooms()
    ]);

    const repairResult = DynamicRepairEngine.repairChamberOutage({
      schedule: interviews.filter(i => !driveId || i.driveId === driveId),
      offlineRoomId,
      date,
      timeRange,
      context: { candidates, interviewers, rooms }
    });

    let persistenceResult = null;
    if (applyImmediately && repairResult.success && repairResult.schedule?.length) {
      persistenceResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId,
        assignments: repairResult.schedule,
        options: { replaceExistingForDrive: true }
      });
    }

    res.json({
      success: repairResult.success,
      data: {
        ...repairResult,
        persisted: Boolean(persistenceResult?.success),
        persistenceDetails: persistenceResult
      }
    });
  } catch (error) {
    console.error('Error during chamber outage repair:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chamber outage repair',
      error: error.message
    });
  }
});

// 5.3 Candidate Reschedule Request
router.post('/reschedule/candidate', async (req, res) => {
  try {
    const {
      driveId = 'drv-101',
      candidateId,
      preferredWindow,
      applyImmediately = false
    } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'candidateId is required'
      });
    }

    const [interviews, candidates, interviewers, rooms] = await Promise.all([
      dbService.getInterviews(),
      dbService.getCandidates(),
      dbService.getInterviewers(),
      dbService.getRooms()
    ]);

    const repairResult = DynamicRepairEngine.rescheduleCandidate({
      schedule: interviews.filter(i => !driveId || i.driveId === driveId),
      candidateId,
      preferredWindow,
      context: { candidates, interviewers, rooms }
    });

    let persistenceResult = null;
    if (applyImmediately && repairResult.success && repairResult.schedule?.length) {
      persistenceResult = await SchedulePersistenceService.applyScheduleTransaction({
        driveId,
        assignments: repairResult.schedule,
        options: { replaceExistingForDrive: true }
      });
    }

    res.json({
      success: repairResult.success,
      data: {
        ...repairResult,
        persisted: Boolean(persistenceResult?.success),
        persistenceDetails: persistenceResult
      }
    });
  } catch (error) {
    console.error('Error during candidate rescheduling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process candidate rescheduling',
      error: error.message
    });
  }
});

export default router;
