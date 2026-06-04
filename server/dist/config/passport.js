"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma_1 = require("./prisma");
const env_1 = __importDefault(require("./env"));
if (!env_1.default.googleClientId || !env_1.default.googleClientSecret) {
    console.warn('Google OAuth credentials are not configured. /api/auth/google will be unavailable.');
}
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.default.googleClientId,
    clientSecret: env_1.default.googleClientSecret,
    callbackURL: env_1.default.googleRedirectUri,
    scope: ['profile', 'email'],
    passReqToCallback: false,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('Google profile did not return an email'), undefined);
        }
        const providerId = profile.id;
        const name = profile.displayName || undefined;
        const avatarUrl = profile.photos?.[0]?.value;
        let user = await prisma_1.prisma.user.findFirst({
            where: {
                providerId,
                provider: 'GOOGLE',
            },
        });
        if (!user) {
            const existingEmailUser = await prisma_1.prisma.user.findUnique({
                where: {
                    email,
                },
            });
            if (existingEmailUser) {
                user = await prisma_1.prisma.user.update({
                    where: { email },
                    data: {
                        provider: 'GOOGLE',
                        providerId,
                        avatarUrl,
                        isVerified: true,
                        name: existingEmailUser.name || name,
                    },
                });
            }
            else {
                user = await prisma_1.prisma.user.create({
                    data: {
                        email,
                        provider: 'GOOGLE',
                        providerId,
                        name,
                        avatarUrl,
                        isVerified: true,
                    },
                });
            }
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
}));
exports.default = passport_1.default;
