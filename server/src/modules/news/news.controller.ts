import { Request, Response } from 'express';
import { fetchNewsForSymbolFromDb } from './news.service';
import { newsQuerySchema } from './news.schemas';
import { newsArraySchema } from './news.types';

export const fetchNewsController = async (req: Request, res: Response) => {
    const {symbol,page,limit}= newsQuerySchema.parse({symbol:req.params.symbol,...req.query});
    const news:newsArraySchema = await fetchNewsForSymbolFromDb(symbol, limit, page);
    if(news.length===0){
        return res.status(404).json({message: symbol ? `No news found for ${symbol}` : 'No news found'});
    }
    res.json(news);
};
