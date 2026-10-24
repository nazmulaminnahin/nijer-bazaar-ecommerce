import { Router } from 'express';
import {
  register, login, getMe,
  updateProfile, changePassword, adminLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Customer Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Admin Auth
router.post('/admin/login', adminLogin);

export default router;