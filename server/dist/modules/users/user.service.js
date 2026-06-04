"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollowStock = exports.followStock = exports.changePassword = exports.updateProfile = void 0;
const prisma_1 = require("../../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const updateProfile = async (userId, data) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found');
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { name: data.name },
    });
    const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
};
exports.updateProfile = updateProfile;
const changePassword = async (userId, data) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.provider !== 'LOCAL' || !user.password) {
        throw new Error('Account does not support password change');
    }
    const isValidPassword = await bcryptjs_1.default.compare(data.oldPassword, user.password);
    if (!isValidPassword) {
        throw new Error('Incorrect old password');
    }
    const hashedNewPassword = await bcryptjs_1.default.hash(data.newPassword, 10);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });
};
exports.changePassword = changePassword;
const followStock = async (userId, symbol) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    if (user.followedStocks.includes(symbol)) {
        return user.followedStocks; // Already following
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            followedStocks: {
                push: symbol
            }
        }
    });
    return updatedUser.followedStocks;
};
exports.followStock = followStock;
const unfollowStock = async (userId, symbol) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    const newStocks = user.followedStocks.filter(s => s !== symbol);
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            followedStocks: {
                set: newStocks
            }
        }
    });
    return updatedUser.followedStocks;
};
exports.unfollowStock = unfollowStock;
