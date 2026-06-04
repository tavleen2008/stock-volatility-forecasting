"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Protected routes (User must be logged in)
router.use(auth_middleware_1.authMiddleware);
router.put('/profile', user_controller_1.updateProfile);
router.post('/change-password', user_controller_1.changePassword);
router.post('/follow/:symbol', user_controller_1.followStock);
router.delete('/follow/:symbol', user_controller_1.unfollowStock);
exports.default = router;
