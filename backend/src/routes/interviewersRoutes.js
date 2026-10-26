import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const interviewers = await dbService.getInterviewers();
    res.json({ success: true, count: interviewers.length, data: interviewers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const interviewer = await dbService.getInterviewerById(req.params.id);
    if (!interviewer) return res.status(404).json({ success: false, message: 'Interviewer not found' });
    res.json({ success: true, data: interviewer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Interviewer name and email are required' });
    }
    const created = await dbService.createInterviewer(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await dbService.updateInterviewer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Interviewer not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbService.deleteInterviewer(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Interviewer not found' });
    res.json({ success: true, message: 'Interviewer removed from directory' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
