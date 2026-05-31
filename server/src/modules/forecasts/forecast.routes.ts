import { Router } from 'express';
import { runForecast } from './forecast.controller';

const router = Router();

// GET /api/forecasts/:symbol  — fetch volatility forecast for a symbol
router.get('/:symbol', runForecast);

// POST /api/forecasts  — body: { symbol: "AAPL" }
router.post('/', runForecast);

export default router;
