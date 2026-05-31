const SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA'];

const YF_BASE = 'https://query1.finance.yahoo.com';
const HEADERS: Record<string, string> = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json',
};

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    currency: string;
    high52Week?: number;
    low52Week?: number;
}

export interface PricePoint {
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
}

async function fetchQuote(symbol: string): Promise<StockQuote> {
    const url = `${YF_BASE}/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${symbol}`);
    const data = (await res.json()) as any;
    const result = data.chart?.result?.[0];
    if (!result) throw new Error(`No chart data for ${symbol}`);

    const meta = result.meta;
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const validCloses = closes.filter((c: number | null) => c !== null);

    const currentPrice: number = meta.regularMarketPrice ?? validCloses[validCloses.length - 1] ?? 0;
    const prevClose: number =
        meta.chartPreviousClose ?? meta.previousClose ?? validCloses[validCloses.length - 2] ?? currentPrice;
    const change = currentPrice - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
        symbol,
        name: meta.longName || meta.shortName || symbol,
        price: parseFloat(currentPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: meta.regularMarketVolume ?? 0,
        marketCap: meta.marketCap,
        currency: meta.currency ?? 'USD',
        high52Week: meta.fiftyTwoWeekHigh,
        low52Week: meta.fiftyTwoWeekLow,
    };
}

async function fetchHistory(symbol: string, range = '1mo'): Promise<PricePoint[]> {
    // Choose interval based on range
    const intervalMap: Record<string, string> = {
        '1d': '5m',
        '5d': '15m',
        '1mo': '1d',
        '3mo': '1d',
        '6mo': '1d',
        '1y': '1wk',
        '5y': '1mo',
    };
    const interval = intervalMap[range] ?? '1d';
    const url = `${YF_BASE}/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${symbol} history`);
    const data = (await res.json()) as any;
    const result = data.chart?.result?.[0];
    if (!result) throw new Error(`No history data for ${symbol}`);

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};

    return timestamps
        .map((ts, i) => ({
            date: new Date(ts * 1000).toISOString().split('T')[0],
            open: quote.open?.[i] ?? null,
            high: quote.high?.[i] ?? null,
            low: quote.low?.[i] ?? null,
            close: quote.close?.[i] ?? null,
            volume: quote.volume?.[i] ?? null,
        }))
        .filter((d) => d.close !== null);
}

export const StockService = {
    getDefaultSymbols: () => SYMBOLS,

    /** Fetch live quotes for all default symbols in parallel */
    list: async (): Promise<StockQuote[]> => {
        const results = await Promise.allSettled(SYMBOLS.map(fetchQuote));
        return results
            .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
            .map((r) => r.value);
    },

    /** Fetch a single quote */
    getQuote: (symbol: string) => fetchQuote(symbol.toUpperCase()),

    /** Fetch OHLCV history */
    getHistory: (symbol: string, range?: string) =>
        fetchHistory(symbol.toUpperCase(), range ?? '1mo'),
};
