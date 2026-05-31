import { StockService, PricePoint } from '../stocks/stock.service';

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

/** Annualised historical volatility (%) from a series of closing prices */
function historicalVolatility(closes: number[]): number {
    if (closes.length < 2) return 0;
    const logReturns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > 0 && closes[i - 1] > 0) {
            logReturns.push(Math.log(closes[i] / closes[i - 1]));
        }
    }
    if (logReturns.length === 0) return 0;
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance =
        logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (logReturns.length - 1);
    const dailyVol = Math.sqrt(variance);
    return parseFloat((dailyVol * Math.sqrt(252) * 100).toFixed(2));
}

/** Relative Strength Index (14-period default) */
function rsi(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    const start = closes.length - period;
    for (let i = start; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

/** Simple moving average */
function sma(values: number[], period: number): number {
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// ---------------------------------------------------------------------------
// Volatility bands: ±1 SD daily move projected N days forward
// ---------------------------------------------------------------------------
function expectedRange(
    currentPrice: number,
    annualisedVol: number,
    days = 5,
): { low: number; high: number } {
    const dailyVol = annualisedVol / 100 / Math.sqrt(252);
    const move = currentPrice * dailyVol * Math.sqrt(days);
    return {
        low: parseFloat((currentPrice - move).toFixed(2)),
        high: parseFloat((currentPrice + move).toFixed(2)),
    };
}

// ---------------------------------------------------------------------------
// ForecastService
// ---------------------------------------------------------------------------
export const ForecastService = {
    predict: async (symbol: string) => {
        const history = await StockService.getHistory(symbol, '3mo');
        const closes = (history as PricePoint[])
            .map((d) => d.close)
            .filter((c): c is number => c !== null);

        if (closes.length === 0) {
            throw new Error(`No price history available for ${symbol}`);
        }

        const currentPrice = closes[closes.length - 1];
        const vol = historicalVolatility(closes);
        const rsiValue = rsi(closes);
        const sma20 = sma(closes, 20);
        const sma50 = sma(closes, 50);

        // 5-day percentage trend
        const recent = closes.slice(-5);
        const trend =
            recent.length >= 2
                ? parseFloat(
                      (((recent[recent.length - 1] - recent[0]) / recent[0]) * 100).toFixed(2),
                  )
                : 0;

        // Signal logic
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (rsiValue < 35 || (trend > 1.5 && currentPrice > sma20)) signal = 'bullish';
        else if (rsiValue > 65 || (trend < -1.5 && currentPrice < sma20)) signal = 'bearish';

        // Risk level based on volatility
        let riskLevel: 'low' | 'medium' | 'high' = 'medium';
        if (vol < 20) riskLevel = 'low';
        else if (vol > 40) riskLevel = 'high';

        return {
            symbol: symbol.toUpperCase(),
            currentPrice,
            historicalVolatility: vol,
            rsi: rsiValue,
            sma20: parseFloat(sma20.toFixed(2)),
            sma50: parseFloat(sma50.toFixed(2)),
            trend,
            expectedRange5d: expectedRange(currentPrice, vol, 5),
            expectedRange30d: expectedRange(currentPrice, vol, 30),
            signal,
            riskLevel,
            chartData: (history as PricePoint[]).map((d) => ({
                date: d.date,
                price: d.close,
                volume: d.volume,
            })),
        };
    },
};
