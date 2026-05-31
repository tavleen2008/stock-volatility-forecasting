import { Router } from 'express';
import { getStockMetrics, getStockDashboard } from './stock.controller';

const router = Router();
router.get('/:symbol/metrics', getStockMetrics);
router.get('/:symbol/dashboard', getStockDashboard);


export default router;
