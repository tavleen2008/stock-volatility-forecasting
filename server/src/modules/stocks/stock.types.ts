import { z } from "zod";
import { stockMetricsResponseSchema } from "./stock.schemas";
import type { NewsArticle } from "../news/news.types";

export type StockMetricsResponse = z.infer<typeof stockMetricsResponseSchema> | null;

export type Stock = {
    symbol: string;
    name?: string;
};

export type StockDashboardResponse = {
    symbol: string;
    metrics: StockMetricsResponse | null;
    news: NewsArticle[];
    forecast: {
        prediction: "UP" | "DOWN" | "FLAT";
        confidence: number;
        targetPrice: number;
    } | null;
};