import { Router } from 'express';
import {
  getCategories,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../controllers/category.controller';
import { authenticateAdmin, requireRole } from '../middleware/adminAuth';

const router = Router();

// Public
router.get('/', getCategories);

// Admin
router.get('/admin/all', authenticateAdmin, adminGetCategories);
router.post('/admin', authenticateAdmin, requireRole('super_admin', 'manager'), adminCreateCategory);
router.put('/admin/:id', authenticateAdmin, requireRole('super_admin', 'manager'), adminUpdateCategory);
router.delete('/admin/:id', authenticateAdmin, requireRole('super_admin', 'manager'), adminDeleteCategory);

export default router;