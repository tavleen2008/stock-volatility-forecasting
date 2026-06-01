"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastService = void 0;
const stock_service_1 = require("../stocks/stock.service");
exports.ForecastService = {
    getVolatilityForecast: async (symbol) => {
        // Fetch 3-month history (approx. 60-65 trading days)
        const history = await (0, stock_service_1.fetchStockHistory)(symbol, '3mo');
        const metrics = await (0, stock_service_1.fetchStockMetrics)(symbol);
        if (!history || history.length === 0 || !metrics) {
            return null;
        }
        const prices = history.map((h) => h.close);
        const currentPrice = metrics.currentPrice;
        // 1. Calculate Simple Moving Averages
        const calculateSMA = (data, period) => {
            if (data.length < period)
                return data.length > 0 ? +(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2) : 0;
            const slice = data.slice(-period);
            return +(slice.reduce((sum, val) => sum + val, 0) / period).toFixed(2);
        };
        const sma20 = calculateSMA(prices, 20);
        const sma50 = calculateSMA(prices, 50);
        // 2. Calculate Trend (last 5 trading days change percent)
        let trend = 0;
        if (prices.length >= 6) {
            const price5DaysAgo = prices[prices.length - 6];
            trend = +(((currentPrice - price5DaysAgo) / price5DaysAgo) * 100).toFixed(2);
        }
        // 3. Calculate 14-day RSI
        const calculateRSI = (data, period = 14) => {
            if (data.length <= period)
                return 50; // default neutral
            let gains = 0;
            let losses = 0;
            // First window
            for (let i = 1; i <= period; i++) {
                const diff = data[i] - data[i - 1];
                if (diff > 0)
                    gains += diff;
                else
                    losses -= diff;
            }
            let avgGain = gains / period;
            let avgLoss = losses / period;
            // Rest of the data
            for (let i = period + 1; i < data.length; i++) {
                const diff = data[i] - data[i - 1];
                avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
                avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
            }
            if (avgLoss === 0)
                return 100;
            const rs = avgGain / avgLoss;
            return +(100 - 100 / (1 + rs)).toFixed(1);
        };
        const rsi = calculateRSI(prices, 14);
        // 4. Calculate Annualized Historical Volatility
        const calculateVolatility = (data) => {
            if (data.length < 2)
                return 25.0; // standard default vol
            const logReturns = [];
            for (let i = 1; i < data.length; i++) {
                const ratio = data[i] / (data[i - 1] || 1);
                logReturns.push(Math.log(ratio > 0 ? ratio : 1.0));
            }
            const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;
            const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (logReturns.length - 1);
            const dailyVol = Math.sqrt(variance);
            const annVol = dailyVol * Math.sqrt(252) * 100;
            return +(annVol).toFixed(2);
        };
        const historicalVolatility = calculateVolatility(prices);
        // 5. Determine Risk Level
        let riskLevel = 'medium';
        if (historicalVolatility < 20) {
            riskLevel = 'low';
        }
        else if (historicalVolatility > 40) {
            riskLevel = 'high';
        }
        // 6. Determine Signal
        let signal = 'neutral';
        if (rsi < 35) {
            signal = 'bullish';
        }
        else if (rsi > 65) {
            signal = 'bearish';
        }
        else if (sma20 > sma50 && trend > 0) {
            signal = 'bullish';
        }
        else if (sma20 < sma50 && trend < 0) {
            signal = 'bearish';
        }
        // 7. Expected price ranges (±1 Standard Deviation)
        const dailyVolFraction = (historicalVolatility / 100) / Math.sqrt(252);
        const vol5d = dailyVolFraction * Math.sqrt(5);
        const expectedRange5d = {
            low: +(currentPrice * Math.exp(-vol5d)).toFixed(2),
            high: +(currentPrice * Math.exp(vol5d)).toFixed(2),
        };
        const vol30d = dailyVolFraction * Math.sqrt(30);
        const expectedRange30d = {
            low: +(currentPrice * Math.exp(-vol30d)).toFixed(2),
            high: +(currentPrice * Math.exp(vol30d)).toFixed(2),
        };
        // 8. Reformat 3-month chart data
        const chartData = history.map((h) => ({
            date: h.date,
            price: h.close,
        }));
        return {
            symbol,
            currentPrice,
            riskLevel,
            signal,
            historicalVolatility,
            rsi,
            trend,
            sma20,
            sma50,
            expectedRange5d,
            expectedRange30d,
            chartData,
        };
    }
};
