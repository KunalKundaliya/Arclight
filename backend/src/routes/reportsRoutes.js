import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const reports = await dbService.getReports();
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await dbService.getNotifications();
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await dbService.markNotificationRead(req.params.id);
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/notifications/read-all', async (req, res) => {
  try {
    const notifs = await dbService.markAllNotificationsRead();
    res.json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
