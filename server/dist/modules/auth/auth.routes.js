"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("../../config/passport"));
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register/send-code', auth_controller_1.sendVerificationCode);
router.post('/register/verify', auth_controller_1.verifyRegistration);
router.post('/register/resend-code', auth_controller_1.resendCode);
// Client-facing aliases directly under /api/auth
router.post('/send-code', auth_controller_1.sendVerificationCode);
router.post('/verify', auth_controller_1.verifyRegistration);
router.post('/login', auth_controller_1.login);
router.post('/refresh', auth_controller_1.refresh);
router.post('/logout', auth_controller_1.logout);
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => {
    passport_1.default.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(401).json({ message: info?.message || 'Google authentication failed' });
        }
        req.user = user;
        return (0, auth_controller_1.googleCallback)(req, res, next);
    })(req, res, next);
});
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.me);
exports.default = router;
