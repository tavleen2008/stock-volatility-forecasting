"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNewsCleanupJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const news_cleanup_1 = require("../modules/news/news.cleanup");
const startNewsCleanupJob = () => {
    // Run the cleanup job every day at midnight
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running scheduled news cleanup job...');
        await (0, news_cleanup_1.deleteStaleNews)();
    });
    console.log('[Cron] News cleanup job scheduled to run daily at midnight.');
};
exports.startNewsCleanupJob = startNewsCleanupJob;
