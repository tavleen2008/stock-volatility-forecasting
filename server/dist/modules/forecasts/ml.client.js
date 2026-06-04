"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlClient = void 0;
const axios_1 = __importDefault(require("axios"));
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8080';
exports.mlClient = {
    getLatestForecast: async (symbol) => {
        try {
            const response = await axios_1.default.post(`${ML_SERVICE_URL}/forecast`, {
                ticker: symbol
            });
            return response.data;
        }
        catch (error) {
            console.error(`[ML Client] Error fetching forecast for ${symbol}:`, error.message);
            throw new Error(`Failed to fetch forecast from ML service: ${error.message}`);
        }
    },
    simulateForecast: async (symbol, hypotheticalSentiment, mockHeadline) => {
        throw new Error("501 Not Implemented: The ML service does not currently support the /simulate endpoint.");
    }
};
