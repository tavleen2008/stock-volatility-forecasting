import { Router } from 'express';
import { listStocks, getStockMetrics, getStockHistory, getStockDashboard } from './stock.controller';

const router = Router();

router.get('/', listStocks);
router.get('/:symbol/metrics', getStockMetrics);
router.get('/:symbol/history', getStockHistory);
router.get('/:symbol/dashboard', getStockDashboard);
router.get('/:symbol', getStockMetrics);

export default router;
