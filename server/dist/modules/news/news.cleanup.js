"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaleNews = void 0;
const prisma_1 = require("../../config/prisma");
const deleteStaleNews = async () => {
    try {
        console.log('[News Cleanup] Looking for articles older than 1 week...');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const result = await prisma_1.prisma.newsArticle.deleteMany({
            where: {
                publishedAt: {
                    lt: oneWeekAgo
                }
            }
        });
        console.log(`[News Cleanup] Successfully deleted ${result.count} stale articles.`);
    }
    catch (error) {
        console.error('[News Cleanup] Error cleaning up stale news:', error.message);
    }
};
exports.deleteStaleNews = deleteStaleNews;
