import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/otp/send', authController.sendOtp);
router.post('/otp/verify', authController.verifyOtp);

// Protected
router.get('/me', authenticate, authController.me);

export default router;
