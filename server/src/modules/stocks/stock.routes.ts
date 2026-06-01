import { Router } from 'express';
import { listStocks, getStockMetrics, getStockHistory, getStockDashboard } from './stock.controller';

const router = Router();

// GET /api/stocks                    → list of tracked stocks with live prices
router.get('/', listStocks);

// GET /api/stocks/:symbol            → individual quote / metrics
router.get('/:symbol/metrics', getStockMetrics);

// GET /api/stocks/:symbol/history    → OHLCV history for charting
router.get('/:symbol/history', getStockHistory);

// GET /api/stocks/:symbol/dashboard  → combined metrics + news + forecast
router.get('/:symbol/dashboard', getStockDashboard);

// Also support plain /api/stocks/:symbol as alias for metrics
router.get('/:symbol', getStockMetrics);

export default router;
