import { Router } from 'express';
import { listStocks, getStockMetrics, getStockHistory, getStockDashboard, getStockOverview, getStockProfile } from './stock.controller';

const router = Router();

router.get('/', listStocks);
<<<<<<< HEAD

// GET /api/stocks/:symbol/metrics    → individual quote / metrics
=======
>>>>>>> 3aa966b00f870a43eefae71ac15c3e1647af5a4f
router.get('/:symbol/metrics', getStockMetrics);
router.get('/:symbol/history', getStockHistory);
router.get('/:symbol/dashboard', getStockDashboard);
<<<<<<< HEAD

// GET /api/stocks/:symbol/overview   → extended quote (P/E, beta, 52-wk, dividends)
router.get('/:symbol/overview', getStockOverview);

// GET /api/stocks/:symbol/profile    → company description, sector, industry
router.get('/:symbol/profile', getStockProfile);

// Also support plain /api/stocks/:symbol as alias for metrics
=======
>>>>>>> 3aa966b00f870a43eefae71ac15c3e1647af5a4f
router.get('/:symbol', getStockMetrics);

export default router;
