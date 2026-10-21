import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all interviewers
router.get('/', (req, res) => {
  const { status, skill } = req.query;
  let interviewers = dbService.getInterviewers();

  if (status && status !== 'all') interviewers = interviewers.filter(i => i.status.toLowerCase() === status.toLowerCase());
  if (skill && skill !== 'all') interviewers = interviewers.filter(i => (i.skills || []).some(s => s.toLowerCase().includes(skill.toLowerCase())));

  res.json({ success: true, count: interviewers.length, data: interviewers });
});

// GET interviewer by id
router.get('/:id', (req, res) => {
  const interviewer = dbService.getInterviewerById(req.params.id);
  if (!interviewer) return res.status(404).json({ success: false, message: 'Interviewer not found' });
  res.json({ success: true, data: interviewer });
});

// POST create interviewer
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Interviewer name and email are required' });
  }
  const created = dbService.createInterviewer(req.body);
  res.status(201).json({ success: true, data: created });
});

// PUT update interviewer
router.put('/:id', (req, res) => {
  const updated = dbService.updateInterviewer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Interviewer not found' });
  res.json({ success: true, data: updated });
});

// DELETE interviewer
router.delete('/:id', (req, res) => {
  const deleted = dbService.deleteInterviewer(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Interviewer not found' });
  res.json({ success: true, message: 'Interviewer removed from panel' });
});

export default router;
