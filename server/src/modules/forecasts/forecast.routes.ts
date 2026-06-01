import { Router } from 'express';
import { runForecast, getForecastBySymbol } from './forecast.controller';

const router = Router();
router.post('/', runForecast);
router.get('/:symbol', getForecastBySymbol);

export default router;
