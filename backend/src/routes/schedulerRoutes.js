import { Router } from 'express';
import { BackendSchedulerEngine } from '../services/schedulerEngine.js';
import { dbService } from '../services/dbService.js';

const router = Router();

// POST run CSP solver
router.post('/solve', (req, res) => {
  try {
    const {
      driveId = 'drv-101',
      roundName = 'System Architecture',
      startDate = '2026-11-02',
      endDate = '2026-11-06',
      durationMinutes = 45,
      bufferMinutes = 15,
      applyToDatabase = false
    } = req.body;

    const candidates = dbService.getCandidates();
    const interviewers = dbService.getInterviewers();
    const rooms = dbService.getRooms();

    const result = BackendSchedulerEngine.solve({
      driveId,
      roundName,
      startDate,
      endDate,
      durationMinutes,
      bufferMinutes,
      candidates,
      interviewers,
      rooms
    });

    // If caller requests automatic commitment to master schedule
    if (applyToDatabase && result.assignments?.length) {
      result.assignments.forEach(item => {
        dbService.createInterview(item);
      });
    }

    res.json({
      success: true,
      data: result
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

export default router;
