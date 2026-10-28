import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET /api/notifications - Fetch all audit & system notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await dbService.getNotifications();
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Notification title is required' });
    }
    const created = await dbService.createNotification(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await dbService.markNotificationRead(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/:id/read - Also support POST for backward compatibility
router.post('/:id/read', async (req, res) => {
  try {
    const notif = await dbService.markNotificationRead(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const notifs = await dbService.markAllNotificationsRead();
    res.json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/read-all - Also support POST for backward compatibility
router.post('/read-all', async (req, res) => {
  try {
    const notifs = await dbService.markAllNotificationsRead();
    res.json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
