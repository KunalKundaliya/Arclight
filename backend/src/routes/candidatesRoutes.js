import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { driveId, status, round } = req.query;
    let candidates = await dbService.getCandidates();

    if (driveId) candidates = candidates.filter(c => c.driveId === driveId);
    if (status && status !== 'all') candidates = candidates.filter(c => c.status?.toLowerCase() === status.toLowerCase());
    if (round && round !== 'all') candidates = candidates.filter(c => c.currentRound?.toLowerCase().includes(round.toLowerCase()));

    res.json({ success: true, count: candidates.length, data: candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cand = await dbService.getCandidateById(req.params.id);
    if (!cand) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, data: cand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Candidate name and email are required' });
    }
    const created = await dbService.createCandidate(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await dbService.updateCandidate(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbService.deleteCandidate(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, message: 'Candidate removed from queue' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
