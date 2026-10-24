import { Router } from 'express';
import {
  getProducts, getProductById,
  adminGetProducts, adminCreateProduct,
  adminUpdateProduct, adminDeleteProduct,
} from '../controllers/product.controller';
import { authenticateAdmin, requireRole } from '../middleware/adminAuth';
import { upload } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin routes
router.get('/admin/all', authenticateAdmin, adminGetProducts);
router.post(
  '/admin/create',
  authenticateAdmin,
  requireRole('super_admin', 'manager'),
  upload.array('images', 10),
  adminCreateProduct
);
router.put(
  '/admin/:id',
  authenticateAdmin,
  requireRole('super_admin', 'manager'),
  adminUpdateProduct
);
router.delete(
  '/admin/:id',
  authenticateAdmin,
  requireRole('super_admin', 'manager'),
  adminDeleteProduct
);

export default router;