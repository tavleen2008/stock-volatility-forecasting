import app from './app';
import config from './config/env';
import { startNewsCollectionJob } from './jobs/collect-news.job';
import { startNewsCleanupJob } from './jobs/cleanup-news.job';

const PORT = config.port;

// Start background jobs
startNewsCollectionJob();
startNewsCleanupJob();

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`TypeScript server listening on port ${PORT}`);
});
