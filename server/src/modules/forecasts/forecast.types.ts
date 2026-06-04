export interface NewsItem {
    headline: string;
    sentiment_score: number;
    sentiment_label: string;
}

export interface SentimentFeatures {
    average_sentiment: number;
    sentiment_std: number;
    sentiment_shock: number;
    article_count: number;
}

export interface ModelMetrics {
    rmse: number;
    mae: number;
    directional_accuracy: number;
}

export interface PredictionInterval {
    lower: number;
    upper: number;
}

export interface ForecastPayload {
    ticker: string;
    generated_at: string;
    data_available_until: string;
    forecast_for: string;
    forecast_type: string;
    forecast_volatility: number;
    actual_volatility?: number;
    prediction_interval: PredictionInterval;
    recommended_model: string;
    confidence_score: number;
    model_metrics: ModelMetrics;
    sentiment_features: SentimentFeatures;
    top_news: NewsItem[];
    reason: string;
    opportunity_score?: number; // Used in opportunities endpoint
}

export interface ForecastHistoryItem {
    date: string;
    predicted_volatility: number;
    actual_volatility: number;
    average_sentiment: number;
}
