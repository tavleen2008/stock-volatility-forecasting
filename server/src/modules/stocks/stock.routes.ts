import { Router } from 'express';
import { getStocks } from './stock.controller';

const router = Router();
router.get('/', getStocks);

export default router;
