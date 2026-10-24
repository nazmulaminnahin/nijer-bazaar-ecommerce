import { Router } from 'express';
import {
  adminGetCustomers,
  adminGetCustomerById,
  adminAddCrmNote,
  adminToggleCustomerStatus,
} from '../controllers/customer.controller';
import { authenticateAdmin, requireRole } from '../middleware/adminAuth';

const router = Router();

router.get('/', authenticateAdmin, adminGetCustomers);
router.get('/:id', authenticateAdmin, adminGetCustomerById);
router.post(
  '/:id/notes',
  authenticateAdmin,
  requireRole('super_admin', 'manager', 'sales_staff'),
  adminAddCrmNote
);
router.put(
  '/:id/status',
  authenticateAdmin,
  requireRole('super_admin', 'manager'),
  adminToggleCustomerStatus
);

export default router;