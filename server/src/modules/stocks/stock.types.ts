import type { StockMetricsResponse } from "./stock.schemas";

export type Stock = {
    symbol: string;
    name?: string;
};

import type { newsArraySchema } from "../news/news.types";

export type StockDashboardResponse = {
    symbol: string;
    metrics: StockMetricsResponse | null;
    news: newsArraySchema;
    forecast: {
        prediction: "UP" | "DOWN" | "FLAT";
        confidence: number;
        targetPrice: number;
    } | null;
};