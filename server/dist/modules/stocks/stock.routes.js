"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controller_1 = require("./stock.controller");
const router = (0, express_1.Router)();
// GET /api/stocks                    → list of tracked stocks with live prices
router.get('/', stock_controller_1.listStocks);
// GET /api/stocks/:symbol            → individual quote / metrics
router.get('/:symbol/metrics', stock_controller_1.getStockMetrics);
// GET /api/stocks/:symbol/history    → OHLCV history for charting
router.get('/:symbol/history', stock_controller_1.getStockHistory);
// GET /api/stocks/:symbol/dashboard  → combined metrics + news + forecast
router.get('/:symbol/dashboard', stock_controller_1.getStockDashboard);
// Also support plain /api/stocks/:symbol as alias for metrics
router.get('/:symbol', stock_controller_1.getStockMetrics);
exports.default = router;
