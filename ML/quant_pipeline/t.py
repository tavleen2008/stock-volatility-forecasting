import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# FinBERT sentiment analysis
from transformers import pipeline

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def fetch_latest_news(limit=5):
    """Fetch the latest `limit` news articles from the NewsArticle table.
    Returns a list of dicts (RealDictCursor) or an empty list on error.
    """
    query = 'SELECT * FROM "NewsArticle" WHERE "symbol" = %s ORDER BY "publishedAt" DESC LIMIT %s;'
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query, ("AAPL",limit,))
                return cur.fetchall()
    except Exception as e:
        print(f"Database error: {e}")
        return []

def analyze_sentiment(articles):
    """Run FinBERT sentiment analysis on a list of news article dicts.
    Expects each article to have a 'title' and/or 'description' field.
    Returns a list of enriched article dicts with a 'sentiment' field.
    """
    # Initialize FinBERT sentiment pipeline (financial tone)
    nlp = pipeline("sentiment-analysis", model="ProsusAI/finbert", tokenizer="ProsusAI/finbert")
    results = []
    for article in articles:
        text = article.get("title") or article.get("description") or article.get("content") or ""
        if not text:
            sentiment = "UNKNOWN"
        else:
            try:
                pred = nlp(text[:512])
                sentiment = pred[0]["label"].upper()
            except Exception as e:
                sentiment = f"ERROR:{e}"
        enriched = dict(article)
        enriched["sentiment"] = sentiment
        results.append(enriched)
    return results

if __name__ == "__main__":
    news = fetch_latest_news(5)
    if not news:
        print("No news fetched.")
    else:
        enriched = analyze_sentiment(news)
        for item in enriched:
            print(f"Symbol: {item.get('symbol','N/A')}, Sentiment: {item.get('sentiment')}, Title: {item.get('title')}")