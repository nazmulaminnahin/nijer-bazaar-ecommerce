import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Temporary handlers
const getStaff = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Staff management feature coming soon' });
};

const createStaff = (_req: any, res: any) => {
  res.json({ success: true, message: 'Create staff feature coming soon' });
};

const updateStaff = (_req: any, res: any) => {
  res.json({ success: true, message: 'Update staff feature coming soon' });
};

const deleteStaff = (_req: any, res: any) => {
  res.json({ success: true, message: 'Delete staff feature coming soon' });
};

// Routes
router.get('/', authenticateAdmin, getStaff);
router.post('/', authenticateAdmin, createStaff);
router.put('/:id', authenticateAdmin, updateStaff);
router.delete('/:id', authenticateAdmin, deleteStaff);

export default router;
