import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Temporary handlers
const getLoyaltyPrograms = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Loyalty programs feature coming soon' });
};

const createLoyaltyProgram = (_req: any, res: any) => {
  res.json({ success: true, message: 'Create loyalty program feature coming soon' });
};

const updateLoyaltyProgram = (_req: any, res: any) => {
  res.json({ success: true, message: 'Update loyalty program feature coming soon' });
};

const deleteLoyaltyProgram = (_req: any, res: any) => {
  res.json({ success: true, message: 'Delete loyalty program feature coming soon' });
};

// Routes
router.get('/', authenticateAdmin, getLoyaltyPrograms);
router.post('/', authenticateAdmin, createLoyaltyProgram);
router.put('/:id', authenticateAdmin, updateLoyaltyProgram);
router.delete('/:id', authenticateAdmin, deleteLoyaltyProgram);

export default router;
