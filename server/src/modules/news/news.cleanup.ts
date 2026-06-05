import { prisma } from '../../config/prisma';

export const deleteStaleNews = async () => {
    try {
        console.log('[News Cleanup] Looking for articles older than 1 week...');
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const result = await prisma.newsArticle.deleteMany({
            where: {
                publishedAt: {
                    lt: oneWeekAgo
                }
            }
        });

        console.log(`[News Cleanup] Successfully deleted ${result.count} stale articles.`);
    } catch (error: any) {
        console.error('[News Cleanup] Error cleaning up stale news:', error.message);
    }
};
