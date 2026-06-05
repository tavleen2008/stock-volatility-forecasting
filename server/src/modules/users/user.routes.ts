import { Router } from 'express';
import {  changePassword, followStock, unfollowStock, updateProfile } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Protected routes (User must be logged in)
router.use(authMiddleware);

router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/follow/:symbol', followStock);
router.delete('/follow/:symbol', unfollowStock);

export default router;
