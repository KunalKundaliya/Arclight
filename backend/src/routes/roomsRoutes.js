import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const rooms = await dbService.getRooms();
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const room = await dbService.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Room name is required' });
    const created = await dbService.createRoom(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await dbService.updateRoom(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbService.deleteRoom(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
