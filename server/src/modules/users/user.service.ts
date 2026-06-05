import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { ChangePasswordInput, UpdateProfileInput } from './user.schemas';

export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name: data.name },
    });

    const { password, ...sanitizedUser } = updatedUser as any;
    return sanitizedUser;
};

export const changePassword = async (userId: string, data: ChangePasswordInput) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.provider !== 'LOCAL' || !user.password) {
        throw new Error('Account does not support password change');
    }

    const isValidPassword = await bcrypt.compare(data.oldPassword, user.password);
    if (!isValidPassword) {
        throw new Error('Incorrect old password');
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });
};

export const followStock = async (userId: string, symbol: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.followedStocks.includes(symbol)) {
        return user.followedStocks; // Already following
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            followedStocks: {
                push: symbol
            }
        }
    });

    return updatedUser.followedStocks;
};

export const unfollowStock = async (userId: string, symbol: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newStocks = user.followedStocks.filter(s => s !== symbol);

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            followedStocks: {
                set: newStocks
            }
        }
    });

    return updatedUser.followedStocks;
};
