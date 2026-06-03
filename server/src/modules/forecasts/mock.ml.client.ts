import { ForecastPayload, ForecastHistoryItem } from './forecast.types';

export const generateMockForecast = (symbol: string, customDate?: Date): ForecastPayload => {
    const date = customDate || new Date();
    const dateString = date.toISOString().split('T')[0];
    
    // Deterministic random-ish values based on symbol length + char codes
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const volatility = 0.10 + ((seed % 20) / 100); // 0.10 to 0.29
    const sentiment = -0.5 + ((seed % 100) / 100); // -0.5 to +0.49
    
    return {
        ticker: symbol,
        generated_at: date.toISOString(),
        data_available_until: new Date(date.getTime() - 1000).toISOString(),
        forecast_for: dateString,
        forecast_type: "same_day_pre_market",
        forecast_volatility: parseFloat(volatility.toFixed(4)),
        recommended_model: "HAR+Sentiment",
        confidence_score: 0.70 + ((seed % 25) / 100),
        model_metrics: {
            rmse: 0.1539,
            mae: 0.1173,
            directional_accuracy: 0.45 + ((seed % 10) / 100)
        },
        sentiment_features: {
            average_sentiment: parseFloat(sentiment.toFixed(2)),
            sentiment_std: 0.28,
            sentiment_shock: 0.13,
            article_count: 15 + (seed % 30)
        },
        top_news: [
            {
                headline: `${symbol} announces major new strategic initiative`,
                sentiment_score: 0.82,
                sentiment_label: "Positive"
            },
            {
                headline: `Analysts mixed on ${symbol} earnings outlook`,
                sentiment_score: 0.10,
                sentiment_label: "Neutral"
            },
            {
                headline: `Supply chain concerns remain for ${symbol}`,
                sentiment_score: -0.43,
                sentiment_label: "Negative"
            }
        ],
        reason: `FinBERT analysed recent articles. Aggregate sentiment is ${sentiment > 0 ? 'positive' : 'negative'} (${sentiment.toFixed(2)}). This combined with historical volatility patterns suggests expected volatility of ${(volatility * 100).toFixed(1)}% for the upcoming trading session.`
    };
};

export const generateMockHistory = (symbol: string, range: string): ForecastHistoryItem[] => {
    let days = 30;
    if (range === '1d') days = 1;
    else if (range === '5d') days = 5;
    else if (range === '1mo') days = 30;
    else if (range === '3mo') days = 90;
    else if (range === '1y') days = 365;

    const history = [];
    const today = new Date();
    const baseVolatility = 0.15 + (Math.random() * 0.1); // Base 15-25%
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate some realistic-looking mock walk
        const randomWalk = (Math.random() - 0.5) * 0.05;
        const predVolatility = Math.max(0.05, baseVolatility + randomWalk);
        
        // Actual volatility usually tracks prediction loosely in a good model
        const actualVolatility = Math.max(0.05, predVolatility + ((Math.random() - 0.5) * 0.04));

        history.push({
            date: date.toISOString().split('T')[0],
            predicted_volatility: parseFloat(predVolatility.toFixed(4)),
            actual_volatility: parseFloat(actualVolatility.toFixed(4)),
            average_sentiment: parseFloat(((Math.random() * 2) - 1).toFixed(2))
        });
    }
    
    return history;
};

export const mockMlClient = {
    getLatestForecast: async (symbol: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return generateMockForecast(symbol);
    },
    
    getHistory: async (symbol: string, range: string) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return generateMockHistory(symbol, range);
    },
    
    simulateForecast: async (symbol: string, hypotheticalSentiment: number, mockHeadline: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const base = generateMockForecast(symbol);
        
        // Override with hypothetical inputs
        base.sentiment_features.average_sentiment = hypotheticalSentiment;
        base.forecast_type = "simulation";
        base.top_news.unshift({
            headline: mockHeadline,
            sentiment_score: hypotheticalSentiment,
            sentiment_label: hypotheticalSentiment > 0.3 ? "Positive" : (hypotheticalSentiment < -0.3 ? "Negative" : "Neutral")
        });
        
        // Adjust volatility based on the sentiment shock
        const shock = Math.abs(hypotheticalSentiment - (-0.5)); // Just a dummy calculation
        base.forecast_volatility = parseFloat((base.forecast_volatility * (1 + (shock * 0.5))).toFixed(4));
        base.reason = `SIMULATION: Based on a hypothetical sentiment of ${hypotheticalSentiment}, predicted volatility increases to ${(base.forecast_volatility * 100).toFixed(1)}%.`;
        
        return base;
    }
};
