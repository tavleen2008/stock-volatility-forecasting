"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./prisma");
const env_1 = __importDefault(require("./env"));
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false,
}, async (email, password, done) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
        }
        if (!user.passwordHash) {
            return done(null, false, { message: 'No local account exists for this email' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid credentials' });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
}));
if (!env_1.default.googleClientId || !env_1.default.googleClientSecret) {
    // Intentionally do not throw during app startup so the server can still run without Google configured.
    // The Google route will fail if these are missing.
    console.warn('Google OAuth credentials are not configured. /api/auth/google will be unavailable.');
}
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.default.googleClientId,
    clientSecret: env_1.default.googleClientSecret,
    callbackURL: env_1.default.googleRedirectUri,
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
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((obj, done) => {
    done(null, obj);
});
exports.default = passport_1.default;
