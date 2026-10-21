import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all interviews
router.get('/', (req, res) => {
  const { driveId, date, interviewerId, candidateId } = req.query;
  let interviews = dbService.getInterviews();

  if (driveId) interviews = interviews.filter(i => i.driveId === driveId);
  if (date) interviews = interviews.filter(i => i.date === date);
  if (interviewerId) interviews = interviews.filter(i => (i.interviewerIds || []).includes(interviewerId));
  if (candidateId) interviews = interviews.filter(i => i.candidateId === candidateId);

  res.json({ success: true, count: interviews.length, data: interviews });
});

// GET interview by id
router.get('/:id', (req, res) => {
  const interview = dbService.getInterviewById(req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: 'Interview session not found' });
  res.json({ success: true, data: interview });
});

// POST schedule / book interview
router.post('/', (req, res) => {
  const { candidateName, date, startTime } = req.body;
  if (!candidateName || !date || !startTime) {
    return res.status(400).json({ success: false, message: 'Candidate name, date and start time are required' });
  }
  const created = dbService.createInterview(req.body);
  res.status(201).json({ success: true, data: created });
});

// PUT update interview
router.put('/:id', (req, res) => {
  const updated = dbService.updateInterview(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Interview session not found' });
  res.json({ success: true, data: updated });
});

// DELETE interview
router.delete('/:id', (req, res) => {
  const deleted = dbService.deleteInterview(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Interview session not found' });
  res.json({ success: true, message: 'Interview session cancelled' });
});

export default router;
