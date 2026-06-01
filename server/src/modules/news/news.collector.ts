import axios from 'axios';
import { prisma } from '../../config/prisma';
import {symbols} from './news.constant';

// Use the API key from environment variables
const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2/everything';

export const collectNewsForSymbol = async (symbol: string) => {
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

        const response = await axios.get(BASE_URL, {
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
            if (article.title === '[Removed]') continue;

            // Ensure we have a valid URL and publication date
            if (!article.url || !article.publishedAt) continue;

            try {
                // Upsert to handle duplicates cleanly based on the unique articleUrl
                await prisma.newsArticle.upsert({
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
            } catch (dbError) {
                // Ignore unique constraint errors in case of race conditions
                console.error(`[News Collector] DB Error saving article ${article.url}:`, dbError);
            }
        }

        console.log(`[News Collector] Saved ${savedCount} new articles for ${symbol}`);
        return articles;
    } catch (error: any) {
        console.error(`[News Collector] Error fetching news for ${symbol}:`, error.message);
        return [];
    }
};

export const collectAllNews = async () => {
    
    console.log(`[News Collector] Starting collection cycle for ${symbols.join(', ')}`);
    
    for (const symbol of symbols) {
        await collectNewsForSymbol(symbol);
        
        // Add a small delay between requests to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('[News Collector] Collection cycle complete.');
};
