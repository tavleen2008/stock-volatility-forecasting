import { Router } from 'express';
import { fetchNewsController } from './news.controller';

const router = Router();
router.get('/', fetchNewsController);
router.get('/:symbol', fetchNewsController);

export default router;
