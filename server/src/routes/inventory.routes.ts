import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Temporary handlers
const getInventory = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Inventory feature coming soon' });
};

const updateInventory = (_req: any, res: any) => {
  res.json({ success: true, message: 'Update inventory feature coming soon' });
};

const getLowStock = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Low stock alerts feature coming soon' });
};

// Routes
router.get('/', authenticateAdmin, getInventory);
router.put('/:productId', authenticateAdmin, updateInventory);
router.get('/low-stock', authenticateAdmin, getLowStock);

export default router;
