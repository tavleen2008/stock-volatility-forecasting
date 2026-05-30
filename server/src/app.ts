import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/user.routes';
import newsRouter from './modules/news/news.routes';
import stocksRouter from './modules/stocks/stock.routes';
import forecastsRouter from './modules/forecasts/forecast.routes';
import healthRouter from './modules/health/health.routes';
import errorMiddleware from './middleware/error.middleware';
import requestLogger from './middleware/request-logger.middleware';
import config from './config/env';

const app = express();

app.use(cors());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.use(requestLogger);

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/news', newsRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/forecasts', forecastsRouter);
app.use('/api/health', healthRouter);

app.get('/', (_req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

export default app;
