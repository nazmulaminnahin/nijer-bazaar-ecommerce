import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Temporary handlers
const getGiftCards = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Gift cards feature coming soon' });
};

const createGiftCard = (_req: any, res: any) => {
  res.json({ success: true, message: 'Create gift card feature coming soon' });
};

const updateGiftCard = (_req: any, res: any) => {
  res.json({ success: true, message: 'Update gift card feature coming soon' });
};

const deleteGiftCard = (_req: any, res: any) => {
  res.json({ success: true, message: 'Delete gift card feature coming soon' });
};

// Routes
router.get('/', authenticateAdmin, getGiftCards);
router.post('/', authenticateAdmin, createGiftCard);
router.put('/:id', authenticateAdmin, updateGiftCard);
router.delete('/:id', authenticateAdmin, deleteGiftCard);

export default router;
