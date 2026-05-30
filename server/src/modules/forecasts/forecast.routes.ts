import { Router } from 'express';
import { runForecast } from './forecast.controller';

const router = Router();
router.post('/', runForecast);

export default router;
