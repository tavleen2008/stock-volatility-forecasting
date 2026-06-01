"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForecastBySymbol = exports.runForecast = void 0;
const forecast_service_1 = require("./forecast.service");
const runForecast = (_req, res) => {
    res.json({ forecast: null });
};
exports.runForecast = runForecast;
const getForecastBySymbol = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol) {
            return res.status(400).json({ message: 'Stock symbol is required' });
        }
        const forecast = await forecast_service_1.ForecastService.getVolatilityForecast(symbol);
        if (!forecast) {
            return res.status(404).json({ message: `Volatility forecast for symbol ${symbol} not found or symbol is invalid` });
        }
        return res.json({ forecast });
    }
    catch (error) {
        console.error(`[Forecast Controller] Error:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error while fetching forecast' });
    }
};
exports.getForecastBySymbol = getForecastBySymbol;
