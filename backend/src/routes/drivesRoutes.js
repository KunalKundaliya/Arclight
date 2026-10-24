import { Router } from 'express';
import { dbService } from '../services/dbService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const drives = await dbService.getDrives();
    res.json({ success: true, count: drives.length, data: drives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const drive = await dbService.getDriveById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.json({ success: true, data: drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Drive name and role are required' });
    }
    const created = await dbService.createDrive(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await dbService.updateDrive(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbService.deleteDrive(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.json({ success: true, message: 'Drive deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
