import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all candidates
router.get('/', (req, res) => {
  const { driveId, status, round } = req.query;
  let candidates = dbService.getCandidates();

  if (driveId) candidates = candidates.filter(c => c.driveId === driveId);
  if (status && status !== 'all') candidates = candidates.filter(c => c.status.toLowerCase() === status.toLowerCase());
  if (round && round !== 'all') candidates = candidates.filter(c => c.currentRound.toLowerCase().includes(round.toLowerCase()));

  res.json({ success: true, count: candidates.length, data: candidates });
});

// GET candidate by id
router.get('/:id', (req, res) => {
  const cand = dbService.getCandidateById(req.params.id);
  if (!cand) return res.status(404).json({ success: false, message: 'Candidate not found' });
  res.json({ success: true, data: cand });
});

// POST create candidate
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Candidate name and email are required' });
  }
  const created = dbService.createCandidate(req.body);
  res.status(201).json({ success: true, data: created });
});

// PUT update candidate
router.put('/:id', (req, res) => {
  const updated = dbService.updateCandidate(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Candidate not found' });
  res.json({ success: true, data: updated });
});

// DELETE candidate
router.delete('/:id', (req, res) => {
  const deleted = dbService.deleteCandidate(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Candidate not found' });
  res.json({ success: true, message: 'Candidate removed from queue' });
});

export default router;
