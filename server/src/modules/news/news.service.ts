const YF_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search';
const HEADERS: Record<string, string> = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json',
};

export interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    publishedAt: string;
    thumbnail: string | null;
    relatedSymbols: string[];
}

async function fetchMarketNews(query = 'stock market finance'): Promise<NewsArticle[]> {
    const url = `${YF_SEARCH}?q=${encodeURIComponent(query)}&newsCount=25&enableFuzzyQuery=false&enableEnhancedTrivialQuery=true`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);
    const data = (await res.json()) as any;

    const articles: any[] = data.news ?? [];
    return articles
        .filter((a: any) => a.title)
        .map((a: any) => ({
            id: a.uuid ?? String(a.providerPublishTime),
            title: a.title,
            summary: a.summary ?? '',
            source: a.publisher ?? 'Unknown',
            url: a.link ?? '#',
            publishedAt: a.providerPublishTime
                ? new Date(a.providerPublishTime * 1000).toISOString()
                : new Date().toISOString(),
            thumbnail:
                a.thumbnail?.resolutions?.find((r: any) => r.width >= 150)?.url ??
                a.thumbnail?.resolutions?.[0]?.url ??
                null,
            relatedSymbols: a.relatedTickers ?? [],
        }));
}

export const NewsService = {
    /** Fetch market news. Optionally pass a query string (e.g. a ticker symbol). */
    collect: (query?: string) => fetchMarketNews(query || 'stock market finance'),
};
