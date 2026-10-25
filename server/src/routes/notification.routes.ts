import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Temporary handlers
const getNotifications = (_req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Notifications feature coming soon' });
};

const markAsRead = (_req: any, res: any) => {
  res.json({ success: true, message: 'Mark notification as read feature coming soon' });
};

// Routes
router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);

export default router;
