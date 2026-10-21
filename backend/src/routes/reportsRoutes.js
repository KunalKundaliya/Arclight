import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all reports
router.get('/', (req, res) => {
  const reports = dbService.getReports();
  res.json({ success: true, data: reports });
});

// GET notifications
router.get('/notifications', (req, res) => {
  const notifications = dbService.getNotifications();
  res.json({ success: true, count: notifications.length, data: notifications });
});

// POST mark notification read
router.post('/notifications/:id/read', (req, res) => {
  const notif = dbService.markNotificationRead(req.params.id);
  res.json({ success: true, data: notif });
});

// POST mark all notifications read
router.post('/notifications/read-all', (req, res) => {
  const notifs = dbService.markAllNotificationsRead();
  res.json({ success: true, data: notifs });
});

// POST reset database
router.post('/reset', (req, res) => {
  dbService.resetDatabase();
  res.json({ success: true, message: 'Database reset to initial Webster 2026 placement state' });
});

export default router;
