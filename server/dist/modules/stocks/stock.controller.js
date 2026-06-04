"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockProfile = exports.getStockOverview = exports.getStockDashboard = exports.getStockHistory = exports.getStockMetrics = exports.listStocks = void 0;
const stock_service_1 = require("./stock.service");
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
/** GET /api/stocks/:symbol/overview — extended quote with P/E, beta, 52-wk, dividends etc. */
const getStockOverview = async (req, res) => {
    const { symbol } = req.params;
    if (!symbol)
        return res.status(400).json({ message: 'Symbol is required' });
    try {
        const overview = await (0, stock_service_1.fetchStockOverview)(symbol.toUpperCase());
        if (!overview)
            return res.status(404).json({ message: `Stock ${symbol} not found` });
        res.json(overview);
    }
    catch (error) {
        console.error(`[Stock Controller] Error fetching overview for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getStockOverview = getStockOverview;
/** GET /api/stocks/:symbol/profile — company description, sector, industry, employees */
const getStockProfile = async (req, res) => {
    const { symbol } = req.params;
    if (!symbol)
        return res.status(400).json({ message: 'Symbol is required' });
    try {
        const profile = await (0, stock_service_1.fetchStockProfile)(symbol.toUpperCase());
        if (!profile)
            return res.status(404).json({ message: `Profile for ${symbol} not found` });
        res.json(profile);
    }
    catch (error) {
        console.error(`[Stock Controller] Error fetching profile for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getStockProfile = getStockProfile;
