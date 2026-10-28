import { Router } from 'express';
import { eventHub } from '../services/eventHub.js';

const router = Router();

// GET /api/events - Real-time SSE stream endpoint
router.get('/', (req, res) => {
  eventHub.addClient(req, res);
});

// GET /api/events/status - Telemetry check of connected sessions
router.get('/status', (req, res) => {
  res.json({
    success: true,
    activeSubscribers: eventHub.getClientCount(),
    timestamp: new Date().toISOString()
  });
});

export default router;
