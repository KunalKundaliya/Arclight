import { Router } from 'express';
import { dbService } from '../services/dbService.js';
import { eventHub } from '../services/eventHub.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { driveId, date, interviewerId, candidateId } = req.query;
    let interviews = await dbService.getInterviews();

    if (driveId) interviews = interviews.filter(i => i.driveId === driveId);
    if (date) interviews = interviews.filter(i => i.date === date);
    if (interviewerId) interviews = interviews.filter(i => (i.interviewerIds || []).includes(interviewerId));
    if (candidateId) interviews = interviews.filter(i => i.candidateId === candidateId);

    res.json({ success: true, count: interviews.length, data: interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const interview = await dbService.getInterviewById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview session not found' });
    res.json({ success: true, data: interview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { candidateName, date, startTime } = req.body;
    if (!candidateName || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Candidate name, date and start time are required' });
    }
    const created = await dbService.createInterview(req.body);

    // Automated Notification Trigger 1: Candidate booking / session created
    await dbService.createNotification({
      title: 'Candidate Trial Slot Confirmed',
      description: `${created.candidateName} scheduled for ${created.roundTitle || 'Technical Screen'} on ${created.date} at ${created.startTime}.`,
      type: 'success'
    }).catch(console.error);

    eventHub.broadcast('INTERVIEW_BOOKED', {
      interviewId: created.id,
      candidateName: created.candidateName,
      roundTitle: created.roundTitle,
      date: created.date,
      startTime: created.startTime
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await dbService.updateInterview(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Interview session not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbService.deleteInterview(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Interview session not found' });
    res.json({ success: true, message: 'Interview session cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
