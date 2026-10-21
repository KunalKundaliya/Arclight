import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all rooms
router.get('/', (req, res) => {
  const rooms = dbService.getRooms();
  res.json({ success: true, count: rooms.length, data: rooms });
});

// GET room by id
router.get('/:id', (req, res) => {
  const room = dbService.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, data: room });
});

// POST create room
router.post('/', (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Room name is required' });
  const created = dbService.createRoom(req.body);
  res.status(201).json({ success: true, data: created });
});

// PUT update room
router.put('/:id', (req, res) => {
  const updated = dbService.updateRoom(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, data: updated });
});

// DELETE room
router.delete('/:id', (req, res) => {
  const deleted = dbService.deleteRoom(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, message: 'Room removed' });
});

export default router;
