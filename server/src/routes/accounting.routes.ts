import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Temporary handlers
const getTransactions = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Transactions feature coming soon' });
};

const getExpenses = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Expenses feature coming soon' });
};

const createTransaction = (_req: any, res: any) => {
  res.json({ success: true, message: 'Create transaction feature coming soon' });
};

const createExpense = (_req: any, res: any) => {
  res.json({ success: true, message: 'Create expense feature coming soon' });
};

// Routes
router.get('/transactions', authenticateAdmin, getTransactions);
router.get('/expenses', authenticateAdmin, getExpenses);
router.post('/transactions', authenticateAdmin, createTransaction);
router.post('/expenses', authenticateAdmin, createExpense);

export default router;
