import cron from 'node-cron';
import { deleteStaleNews } from '../modules/news/news.cleanup';

export const startNewsCleanupJob = () => {
    // Run the cleanup job every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running scheduled news cleanup job...');
        await deleteStaleNews();
    });
    
    console.log('[Cron] News cleanup job scheduled to run daily at midnight.');
};
