import { Router } from 'express';
import {
  getSalesReport,
  getProductsReport,
  getCustomersReport,
} from '../controllers/report.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

router.get('/sales', authenticateAdmin, getSalesReport);
router.get('/products', authenticateAdmin, getProductsReport);
router.get('/customers', authenticateAdmin, getCustomersReport);

export default router;