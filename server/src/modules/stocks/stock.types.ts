import type { StockMetricsResponse } from "./stock.schemas";

export type Stock = {
    symbol: string;
    name?: string;
};