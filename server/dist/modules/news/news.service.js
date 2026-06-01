"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNewsForSymbolFromDb = void 0;
const prisma_1 = require("../../config/prisma");
const fetchNewsForSymbolFromDb = async (symbol, limit = 10, page = 1) => {
    try {
        const whereClause = symbol ? { symbol } : {};
        const news = await prisma_1.prisma.newsArticle.findMany({
            where: whereClause,
            orderBy: [
                { publishedAt: 'desc' }
            ],
            take: limit,
            skip: limit * (page - 1)
        });
        console.log(`[News Service] Found ${news.length} articles${symbol ? ` for ${symbol}` : ''}`);
        return news;
    }
    catch (error) {
        console.error(`[News Service] Error fetching news${symbol ? ` for ${symbol}` : ''}:`, error.message);
        return [];
    }
};
exports.fetchNewsForSymbolFromDb = fetchNewsForSymbolFromDb;
