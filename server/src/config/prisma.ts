import "dotenv/config";
import { PrismaClient } from "../database/generated/prisma";

const prisma = new PrismaClient();
export { prisma };