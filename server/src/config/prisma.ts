import "dotenv/config";
import { PrismaClient } from "../database/generated/prisma";
import config from './env';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: config.databaseUrl,
        },
    },
});
export { prisma };