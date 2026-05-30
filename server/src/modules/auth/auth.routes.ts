import { Router } from 'express';
import passport from '../../config/passport';
import { googleCallback, me } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

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
