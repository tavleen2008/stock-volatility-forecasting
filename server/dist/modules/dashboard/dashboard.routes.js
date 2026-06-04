"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forecast_service_1 = require("../forecasts/forecast.service");
const router = (0, express_1.Router)();
router.get('/home', async (req, res) => {
    try {
        // High level overview
        const opportunities = await forecast_service_1.ForecastService.getForecastOpportunities();
        // Let's just fetch the mood logic here or call market route, 
        // For simplicity, we can just return top opportunities as the "home" payload 
        // to power the dashboard widgets.
        return res.json({
            top_opportunities: opportunities,
            dashboard_message: "Welcome to the Volatility Dashboard. Monitor your tracked stocks below."
        });
    }
    catch (error) {
        console.error(`[Dashboard Controller] Error fetching home:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
});
exports.default = router;
