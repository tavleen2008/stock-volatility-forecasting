import { Router } from 'express';
import { getLatestForecast, getForecastHistory, getForecastSummary, getForecastAccuracy, getForecastNewsImpact, getForecastScreener, getForecastOpportunities } from './forecast.controller';
import { validateMiddleware } from '../../middleware/validate.middleware';
import { symbolParamSchema, symbolAndRangeSchema, screenerQuerySchema } from './forecast.schemas';

const router = Router();

// Phase 3: Macro & Discovery
router.get('/screener', validateMiddleware(screenerQuerySchema), getForecastScreener);
router.get('/opportunities', getForecastOpportunities);

// Phase 1: Core Functionality
router.get('/:symbol/latest', validateMiddleware(symbolParamSchema), getLatestForecast);
router.get('/:symbol/history', validateMiddleware(symbolAndRangeSchema), getForecastHistory);
router.get('/:symbol/summary', validateMiddleware(symbolParamSchema), getForecastSummary);

// Phase 2: Validation & Trust
router.get('/:symbol/accuracy', validateMiddleware(symbolAndRangeSchema), getForecastAccuracy);
router.get('/:symbol/news-impact', validateMiddleware(symbolParamSchema), getForecastNewsImpact);

export default router;
