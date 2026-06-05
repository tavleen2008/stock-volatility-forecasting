import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';

import { prisma } from './prisma';
import config from './env';

if (!config.googleClientId || !config.googleClientSecret) {
    console.warn('Google OAuth credentials are not configured. /api/auth/google will be unavailable.');
}

passport.use(
    new GoogleStrategy(
        {
            clientID: config.googleClientId,
            clientSecret: config.googleClientSecret,
            callbackURL: config.googleRedirectUri,
            passReqToCallback: false,
        },
        async (_accessToken, _refreshToken, profile: Profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(new Error('Google profile did not return an email'), undefined);
                }

                const providerId = profile.id;
                const name = profile.displayName || undefined;
                const avatarUrl = profile.photos?.[0]?.value;

                let user = await prisma.user.findFirst({
                    where: {
                        providerId,
                        provider: 'GOOGLE',
                    },
                });

                if (!user) {
                    const existingEmailUser = await prisma.user.findUnique({
                        where: {
                            email,
                        },
                    });

                    if (existingEmailUser) {
                        user = await prisma.user.update({
                            where: { email },
                            data: {
                                provider: 'GOOGLE',
                                providerId,
                                avatarUrl,
                                isVerified: true,
                                name: existingEmailUser.name || name,
                            },
                        });
                    } else {
                        user = await prisma.user.create({
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
            } catch (error) {
                return done(error as Error);
            }
        }
    )
);

export default passport;
