"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controller_1 = require("./stock.controller");
const router = (0, express_1.Router)();
router.get('/', stock_controller_1.listStocks);
// GET /api/stocks/:symbol/metrics    → individual quote / metrics
router.get('/:symbol/metrics', stock_controller_1.getStockMetrics);
router.get('/:symbol/history', stock_controller_1.getStockHistory);
router.get('/:symbol/dashboard', stock_controller_1.getStockDashboard);
// GET /api/stocks/:symbol/overview   → extended quote (P/E, beta, 52-wk, dividends)
router.get('/:symbol/overview', stock_controller_1.getStockOverview);
// GET /api/stocks/:symbol/profile    → company description, sector, industry
router.get('/:symbol/profile', stock_controller_1.getStockProfile);
// Also support plain /api/stocks/:symbol as alias for metrics
router.get('/:symbol', stock_controller_1.getStockMetrics);
exports.default = router;
