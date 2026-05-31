import { prisma } from "../../config/prisma";

export const fetchNewsForSymbolFromDb=async(symbol?:string,limit:number=10,page:number=1)=>{
    try{
        const whereClause = symbol ? { symbol } : {};
        const news=await prisma.newsArticle.findMany({
            where: whereClause,
            orderBy:[
                {publishedAt:'desc'}
            ],
            take:limit,
            skip:limit*(page-1)
        })
        console.log(`[News Service] Found ${news.length} articles${symbol ? ` for ${symbol}` : ''}`);
        return news;
    }
    catch(error:any){
        console.error(`[News Service] Error fetching news${symbol ? ` for ${symbol}` : ''}:`, error.message);
        return []
    }
}