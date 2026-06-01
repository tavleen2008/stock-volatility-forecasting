"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const prisma_1 = require("../database/generated/prisma");
const env_1 = __importDefault(require("./env"));
const prisma = new prisma_1.PrismaClient({
    datasources: {
        db: {
            url: env_1.default.databaseUrl,
        },
    },
});
exports.prisma = prisma;
