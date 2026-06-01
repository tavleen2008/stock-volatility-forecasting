"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectAllNews = exports.collectNewsForSymbol = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../../config/prisma");
const news_constant_1 = require("./news.constant");
// Use the API key from environment variables
const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2/everything';
const collectNewsForSymbol = async (symbol) => {
    if (!API_KEY) {
        console.error('NEWS_API_KEY is not defined in environment variables.');
        return [];
    }
    try {
        console.log(`[News Collector] Fetching news for ${symbol}...`);
        // Fetch last 3 days of news for this symbol to avoid massive payloads
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
        const fromDateString = fromDate.toISOString().split('T')[0];
        const response = await axios_1.default.get(BASE_URL, {
            params: {
                q: symbol,
                from: fromDateString,
                sortBy: 'publishedAt',
                language: 'en',
                apiKey: API_KEY,
            }
        });
        const articles = response.data.articles || [];
        console.log(`[News Collector] Found ${articles.length} articles for ${symbol}`);
        let savedCount = 0;
        for (const article of articles) {
            // NewsAPI returns a special '[Removed]' string for deleted articles
            if (article.title === '[Removed]')
                continue;
            // Ensure we have a valid URL and publication date
            if (!article.url || !article.publishedAt)
                continue;
            try {
                // Upsert to handle duplicates cleanly based on the unique articleUrl
                await prisma_1.prisma.newsArticle.upsert({
                    where: { articleUrl: article.url },
                    update: {}, // Don't update anything if it exists
                    create: {
                        symbol: symbol,
                        title: article.title,
                        description: article.description,
                        source: article.source?.name,
                        articleUrl: article.url,
                        publishedAt: new Date(article.publishedAt),
                    }
                });
                savedCount++;
            }
            catch (dbError) {
                // Ignore unique constraint errors in case of race conditions
                console.error(`[News Collector] DB Error saving article ${article.url}:`, dbError);
            }
        }
        console.log(`[News Collector] Saved ${savedCount} new articles for ${symbol}`);
        return articles;
    }
    catch (error) {
        console.error(`[News Collector] Error fetching news for ${symbol}:`, error.message);
        return [];
    }
};
exports.collectNewsForSymbol = collectNewsForSymbol;
const collectAllNews = async () => {
    console.log(`[News Collector] Starting collection cycle for ${news_constant_1.symbols.join(', ')}`);
    for (const symbol of news_constant_1.symbols) {
        await (0, exports.collectNewsForSymbol)(symbol);
        // Add a small delay between requests to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('[News Collector] Collection cycle complete.');
};
exports.collectAllNews = collectAllNews;
