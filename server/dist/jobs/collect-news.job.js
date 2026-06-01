"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNewsCollectionJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const news_collector_1 = require("../modules/news/news.collector");
const startNewsCollectionJob = () => {
    // Run the job every hour at the top of the hour (e.g. 1:00, 2:00, etc.)
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('[Cron] Running scheduled news collection job...');
        await (0, news_collector_1.collectAllNews)();
    });
    console.log('[Cron] News collection job scheduled to run hourly.');
};
exports.startNewsCollectionJob = startNewsCollectionJob;
