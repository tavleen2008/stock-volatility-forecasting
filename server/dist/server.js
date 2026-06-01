"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const collect_news_job_1 = require("./jobs/collect-news.job");
const cleanup_news_job_1 = require("./jobs/cleanup-news.job");
const PORT = env_1.default.port;
// Start background jobs
(0, collect_news_job_1.startNewsCollectionJob)();
(0, cleanup_news_job_1.startNewsCleanupJob)();
app_1.default.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`TypeScript server listening on port ${PORT}`);
});
