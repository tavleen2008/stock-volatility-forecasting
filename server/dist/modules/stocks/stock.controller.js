"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockDashboard = exports.getStockHistory = exports.getStockMetrics = exports.listStocks = void 0;
const stock_service_1 = require("./stock.service");
/** GET /api/stocks — list of all tracked stocks with live quotes */
const listStocks = async (_req, res) => {
    try {
        const stocks = await (0, stock_service_1.fetchTrackedStocksList)();
        res.json({ stocks });
    }
    catch (error) {
        console.error('[Stock Controller] Error listing stocks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.listStocks = listStocks;
/** GET /api/stocks/:symbol — individual stock metrics */
const getStockMetrics = async (req, res) => {
    const { symbol } = req.params;
    if (!symbol)
        return res.status(400).json({ message: 'Symbol is required' });
    const metrics = await (0, stock_service_1.fetchStockMetrics)(symbol.toUpperCase());
    if (!metrics)
        return res.status(404).json({ message: `Stock ${symbol} not found` });
    res.json(metrics);
};
exports.getStockMetrics = getStockMetrics;
/** GET /api/stocks/:symbol/history?range=1mo */
const getStockHistory = async (req, res) => {
    const { symbol } = req.params;
    const range = req.query.range || '1mo';
    if (!symbol)
        return res.status(400).json({ message: 'Symbol is required' });
    try {
        const history = await (0, stock_service_1.fetchStockHistory)(symbol.toUpperCase(), range);
        res.json({ symbol: symbol.toUpperCase(), range, history });
    }
    catch (error) {
        console.error(`[Stock Controller] Error fetching history for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getStockHistory = getStockHistory;
/** GET /api/stocks/:symbol/dashboard — full dashboard payload */
const getStockDashboard = async (req, res) => {
    const { symbol } = req.params;
    if (!symbol)
        return res.status(400).json({ message: 'Symbol is required' });
    try {
        const dashboard = await (0, stock_service_1.fetchStockDashboard)(symbol.toUpperCase());
        res.json(dashboard);
    }
    catch (error) {
        console.error(`[Stock Controller] Error fetching dashboard for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getStockDashboard = getStockDashboard;
