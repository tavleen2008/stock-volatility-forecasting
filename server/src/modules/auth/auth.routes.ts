import { Router } from 'express';
import passport from '../../config/passport';
import { googleCallback, me, sendVerificationCode, verifyRegistration, resendCode, login, refresh, logout, forgotPassword, resetPassword } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register/send-code', sendVerificationCode);
router.post('/register/verify', verifyRegistration);
router.post('/register/resend-code', resendCode);

// Client-facing aliases directly under /api/auth
router.post('/send-code', sendVerificationCode);
router.post('/verify', verifyRegistration);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/login', login);
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
