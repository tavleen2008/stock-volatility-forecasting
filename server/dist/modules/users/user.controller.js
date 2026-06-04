"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollowStock = exports.followStock = exports.changePassword = exports.updateProfile = void 0;
const zod_1 = require("zod");
const userService = __importStar(require("./user.service"));
const user_schemas_1 = require("./user.schemas");
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = user_schemas_1.updateProfileSchema.parse(req.body);
        const updatedUser = await userService.updateProfile(userId, data);
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        return next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = user_schemas_1.changePasswordSchema.parse(req.body);
        await userService.changePassword(userId, data);
        return res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error instanceof Error && (error.message === 'Incorrect old password' || error.message === 'Account does not support password change')) {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};
exports.changePassword = changePassword;
const followStock = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { params } = user_schemas_1.followStockSchema.parse(req);
        const followedStocks = await userService.followStock(userId, params.symbol);
        return res.status(200).json({
            message: `Successfully followed ${params.symbol}`,
            followedStocks
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        return next(error);
    }
};
exports.followStock = followStock;
const unfollowStock = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { params } = user_schemas_1.followStockSchema.parse(req);
        const followedStocks = await userService.unfollowStock(userId, params.symbol);
        return res.status(200).json({
            message: `Successfully unfollowed ${params.symbol}`,
            followedStocks
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        return next(error);
    }
};
exports.unfollowStock = unfollowStock;
