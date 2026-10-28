import { Router } from 'express';
import { dbService } from '../services/dbService.js';
import { eventHub } from '../services/eventHub.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const evaluations = await dbService.getEvaluations();
    res.json({ success: true, count: evaluations.length, data: evaluations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const evaluation = await dbService.getEvaluationById(req.params.id);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation scorecard not found' });
    res.json({ success: true, data: evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const saved = await dbService.saveEvaluation(req.body);

    // Automated Notification Trigger 3: Evaluation Scorecard Submitted
    await dbService.createNotification({
      title: 'Interview Evaluation Submitted',
      description: `${saved.interviewerName || 'Faculty'} submitted evaluation for ${saved.candidateName} (${saved.recommendation || 'Evaluated'}, score: ${saved.totalScore}/100).`,
      type: 'info'
    }).catch(console.error);

    eventHub.broadcast('EVALUATION_SUBMITTED', {
      candidateName: saved.candidateName,
      interviewerName: saved.interviewerName,
      score: saved.totalScore,
      recommendation: saved.recommendation
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
