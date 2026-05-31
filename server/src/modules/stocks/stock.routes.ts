import { Router } from 'express';
import { getStocks, getStockQuote, getStockHistory } from './stock.controller';

const router = Router();

router.get('/', getStocks);
router.get('/:symbol/history', getStockHistory);
router.get('/:symbol', getStockQuote);

export default router;
