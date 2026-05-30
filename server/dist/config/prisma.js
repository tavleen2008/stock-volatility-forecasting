"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const prisma_1 = require("../database/generated/prisma");
const prisma = new prisma_1.PrismaClient();
exports.prisma = prisma;
