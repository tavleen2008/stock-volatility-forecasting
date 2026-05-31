import { Router } from 'express';
import { getStockMetrics } from './stock.controller';

const router = Router();
router.get('/:symbol/metrics', getStockMetrics);


export default router;
