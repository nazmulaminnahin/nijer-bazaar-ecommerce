import { Router } from 'express';
import {
  placeOrder, getMyOrders, trackOrder,
  adminGetOrders, adminGetOrderById,
  adminUpdateOrderStatus, adminGetOrderStats,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { authenticateAdmin, requireRole } from '../middleware/adminAuth';

const router = Router();

// Public
router.get('/track', trackOrder);

// Customer Protected
router.post('/', authenticate, placeOrder);
router.get('/my', authenticate, getMyOrders);

// Admin
router.get('/admin/all', authenticateAdmin, adminGetOrders);
router.get('/admin/stats', authenticateAdmin, adminGetOrderStats);
router.get('/admin/:id', authenticateAdmin, adminGetOrderById);
router.put(
  '/admin/:id/status',
  authenticateAdmin,
  requireRole('super_admin', 'manager', 'sales_staff'),
  adminUpdateOrderStatus
);

export default router;