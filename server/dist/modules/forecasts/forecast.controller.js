"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForecastOpportunities = exports.getForecastScreener = exports.getForecastNewsImpact = exports.getForecastAccuracy = exports.getForecastSummary = exports.getForecastHistory = exports.getLatestForecast = void 0;
const forecast_service_1 = require("./forecast.service");
const getLatestForecast = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol)
            return res.status(400).json({ message: 'Stock symbol is required' });
        const forecast = await forecast_service_1.ForecastService.getLatestForecast(symbol);
        if (!forecast)
            return res.status(404).json({ message: `Forecast not found for ${symbol}` });
        return res.json(forecast);
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching latest forecast:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getLatestForecast = getLatestForecast;
const getForecastHistory = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        const range = req.query.range || '1mo';
        if (!symbol)
            return res.status(400).json({ message: 'Stock symbol is required' });
        const history = await forecast_service_1.ForecastService.getForecastHistory(symbol, range);
        if (!history || history.length === 0)
            return res.status(404).json({ message: `Forecast history not found for ${symbol}` });
        return res.json(history);
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching history:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getForecastHistory = getForecastHistory;
const getForecastSummary = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol)
            return res.status(400).json({ message: 'Stock symbol is required' });
        const summary = await forecast_service_1.ForecastService.getForecastSummary(symbol);
        if (!summary)
            return res.status(404).json({ message: `Forecast summary not found for ${symbol}` });
        return res.json({ summary });
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching forecast summary:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getForecastSummary = getForecastSummary;
const getForecastAccuracy = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        const range = req.query.range || '1mo';
        if (!symbol)
            return res.status(400).json({ message: 'Stock symbol is required' });
        const accuracyData = await forecast_service_1.ForecastService.getForecastAccuracy(symbol, range);
        if (!accuracyData)
            return res.status(404).json({ message: `Data not found for ${symbol}` });
        return res.json(accuracyData);
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching accuracy:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getForecastAccuracy = getForecastAccuracy;
const getForecastNewsImpact = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol)
            return res.status(400).json({ message: 'Stock symbol is required' });
        const newsImpact = await forecast_service_1.ForecastService.getForecastNewsImpact(symbol);
        if (!newsImpact)
            return res.status(404).json({ message: `News impact not found for ${symbol}` });
        return res.json(newsImpact);
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching news impact:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getForecastNewsImpact = getForecastNewsImpact;
const getForecastScreener = async (req, res) => {
    try {
        const filters = {
            minVolatility: req.query.minVolatility ? parseFloat(req.query.minVolatility) : undefined,
            sentiment: req.query.sentiment || 'all',
            minConfidence: req.query.minConfidence ? parseFloat(req.query.minConfidence) : undefined,
        };
        const screenerResults = await forecast_service_1.ForecastService.getForecastScreener(filters);
        return res.json(screenerResults);
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching screener:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getForecastScreener = getForecastScreener;
const getForecastOpportunities = async (req, res) => {
    try {
        const opportunities = await forecast_service_1.ForecastService.getForecastOpportunities();
        return res.json(opportunities);
    }
    catch (error) {
        console.error(`[Forecast Controller] Error fetching opportunities:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
exports.getForecastOpportunities = getForecastOpportunities;
