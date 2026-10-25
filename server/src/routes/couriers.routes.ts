import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Temporary handlers until controllers are implemented
const getCouriers = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Couriers feature coming soon' });
};

const createCourier = (_req: any, res: any) => {
  res.json({ success: true, message: 'Create courier feature coming soon' });
};

const updateCourier = (_req: any, res: any) => {
  res.json({ success: true, message: 'Update courier feature coming soon' });
};

const deleteCourier = (_req: any, res: any) => {
  res.json({ success: true, message: 'Delete courier feature coming soon' });
};

// Routes
router.get('/', authenticateAdmin, getCouriers);
router.post('/', authenticateAdmin, createCourier);
router.put('/:id', authenticateAdmin, updateCourier);
router.delete('/:id', authenticateAdmin, deleteCourier);

export default router;
