import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

// GET all drives
router.get('/', (req, res) => {
  const drives = dbService.getDrives();
  res.json({ success: true, count: drives.length, data: drives });
});

// GET drive by id
router.get('/:id', (req, res) => {
  const drive = dbService.getDriveById(req.params.id);
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
  res.json({ success: true, data: drive });
});

// POST create drive
router.post('/', (req, res) => {
  const { name, role, company } = req.body;
  if (!name || !role) {
    return res.status(400).json({ success: false, message: 'Drive name and role are required' });
  }
  const created = dbService.createDrive(req.body);
  res.status(201).json({ success: true, data: created });
});

// PUT update drive
router.put('/:id', (req, res) => {
  const updated = dbService.updateDrive(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Drive not found' });
  res.json({ success: true, data: updated });
});

// DELETE drive
router.delete('/:id', (req, res) => {
  const deleted = dbService.deleteDrive(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Drive not found' });
  res.json({ success: true, message: 'Drive deleted successfully' });
});

export default router;
