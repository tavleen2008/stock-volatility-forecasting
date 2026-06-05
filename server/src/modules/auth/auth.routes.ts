import { Router } from 'express';
import passport from '../../config/passport';
import { googleCallback, me, sendVerificationCode, verifyRegistration, resendCode, login, refresh, logout, forgotPassword, resetPassword } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

router.post('/register/send-code', authLimiter, sendVerificationCode);
router.post('/register/verify', authLimiter, verifyRegistration);
router.post('/register/resend-code', authLimiter, resendCode);

// Client-facing aliases directly under /api/auth
router.post('/send-code', authLimiter, sendVerificationCode);
router.post('/verify', authLimiter, verifyRegistration);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(401).json({ message: info?.message || 'Google authentication failed' });
        }

        req.user = user;
        return googleCallback(req, res, next);
    })(req, res, next);
});
router.get('/me', authMiddleware, me);

export default router;
