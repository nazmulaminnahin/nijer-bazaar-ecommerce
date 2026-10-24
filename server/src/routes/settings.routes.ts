import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticateAdmin, requireRole } from '../middleware/adminAuth';

const router = Router();

router.get('/', authenticateAdmin, getSettings);
router.put('/', authenticateAdmin, requireRole('super_admin'), updateSettings);

export default router;