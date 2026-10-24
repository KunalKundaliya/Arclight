import { Router } from 'express';
import { BackendSchedulerEngine } from '../services/schedulerEngine.js';
import { dbService } from '../services/dbService.js';

const router = Router();

// POST run CSP solver
router.post('/solve', async (req, res) => {
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

    const candidates = await dbService.getCandidates();
    const interviewers = await dbService.getInterviewers();
    const rooms = await dbService.getRooms();

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

    if (applyToDatabase && result.assignments?.length) {
      for (const item of result.assignments) {
        await dbService.createInterview(item);
      }
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
