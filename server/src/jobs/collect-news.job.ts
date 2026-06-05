import cron from 'node-cron';
import { collectAllNews } from '../modules/news/news.collector';

export const startNewsCollectionJob = () => {
    // Run the job every hour at the top of the hour (e.g. 1:00, 2:00, etc.)
    cron.schedule('0 * * * *', async () => {
        console.log('[Cron] Running scheduled news collection job...');
        await collectAllNews();
    });
    
    console.log('[Cron] News collection job scheduled to run hourly.');
};
