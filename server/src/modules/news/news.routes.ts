import { Router } from 'express';
import { fetchNews } from './news.controller';

const router = Router();
router.get('/', fetchNews);

export default router;
