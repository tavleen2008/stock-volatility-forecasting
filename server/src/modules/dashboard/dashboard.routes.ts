import { Router, Request, Response } from 'express';
import { ForecastService } from '../forecasts/forecast.service';

const router = Router();

router.get('/home', async (req: Request, res: Response) => {
    try {
        // High level overview
        const opportunities = await ForecastService.getForecastOpportunities();
        
        // Let's just fetch the mood logic here or call market route, 
        // For simplicity, we can just return top opportunities as the "home" payload 
        // to power the dashboard widgets.
        return res.json({
            top_opportunities: opportunities,
            dashboard_message: "Welcome to the Volatility Dashboard. Monitor your tracked stocks below."
        });
    } catch (error: any) {
        console.error(`[Dashboard Controller] Error fetching home:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
});

export default router;
