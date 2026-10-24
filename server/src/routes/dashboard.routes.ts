import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

router.get('/', authenticateAdmin, getDashboardStats);

export default router;