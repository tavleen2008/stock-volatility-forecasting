import axios from 'axios';
import { ForecastPayload } from './forecast.types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8080';

export const mlClient = {
    getLatestForecast: async (symbol: string): Promise<ForecastPayload> => {
        try {
            const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
                ticker: symbol
            });
            return response.data;
        } catch (error: any) {
            console.error(`[ML Client] Error fetching forecast for ${symbol}:`, error.message);
            throw new Error(`Failed to fetch forecast from ML service: ${error.message}`);
        }
    },
    
    simulateForecast: async (symbol: string, hypotheticalSentiment: number, mockHeadline: string): Promise<ForecastPayload> => {
        throw new Error("501 Not Implemented: The ML service does not currently support the /simulate endpoint.");
    }
};
