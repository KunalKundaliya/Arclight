import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all evaluations
router.get('/', (req, res) => {
  const evaluations = dbService.getEvaluations();
  res.json({ success: true, count: evaluations.length, data: evaluations });
});

// GET evaluation by id
router.get('/:id', (req, res) => {
  const evaluation = dbService.getEvaluationById(req.params.id);
  if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation scorecard not found' });
  res.json({ success: true, data: evaluation });
});

// POST save / submit evaluation
router.post('/', (req, res) => {
  const { candidateId, interviewerId } = req.body;
  const saved = dbService.saveEvaluation(req.body);
  res.status(201).json({ success: true, data: saved });
});

export default router;
