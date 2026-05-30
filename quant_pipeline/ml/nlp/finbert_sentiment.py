"""FinBERT sentiment inference and aggregation."""

from dataclasses import dataclass
import logging

import pandas as pd

try:
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
except Exception:  # pragma: no cover
    torch = None
    AutoModelForSequenceClassification = None
    AutoTokenizer = None
    pipeline = None

try:
    from sqlalchemy import select
    from sqlalchemy.orm import Session
except Exception:  # pragma: no cover
    select = None
    Session = object

from ml.data.schemas import NewsArticle, SentimentResult

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class SentimentPrediction:
    """One FinBERT prediction record."""

    sentiment_label: str
    sentiment_score: float
    positive_probability: float
    neutral_probability: float
    negative_probability: float


class FinBertSentimentService:
    """FinBERT inference service with DB persistence."""

    def __init__(self, model_name: str = "ProsusAI/finbert") -> None:
        self.model_name = model_name
        # device=-1 for CPU pipeline fallback; when torch is unavailable use -1
        if torch is None:
            self.device = -1
        else:
            try:
                self.device = 0 if torch.cuda.is_available() else -1
            except Exception:
                self.device = -1
        self._predictor = None

    def load_model(self) -> None:
        """Load tokenizer and model into a transformers pipeline."""

        if torch is None or AutoTokenizer is None or AutoModelForSequenceClassification is None or pipeline is None:
            logger.warning("Transformers stack unavailable; using heuristic sentiment fallback")
            self._predictor = None
            return

        try:
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self._predictor = pipeline(
                "text-classification",
                model=model,
                tokenizer=tokenizer,
                top_k=None,
                truncation=True,
                device=self.device,
            )
            logger.info("FinBERT model loaded", extra={"model_name": self.model_name})
        except Exception as exc:
            logger.exception("Failed to load FinBERT model")
            raise RuntimeError("FinBERT model loading failed") from exc

    def predict_batch(self, texts: list[str], batch_size: int = 16) -> list[SentimentPrediction]:
        """Predict sentiment probabilities for batch texts."""

        if not texts:
            return []
        if self._predictor is None:
            self.load_model()
        if self._predictor is None:
            return [self._heuristic_predict(text) for text in texts]
        try:
            outputs = self._predictor(texts, batch_size=batch_size)
        except Exception as exc:
            logger.exception("FinBERT prediction failed", extra={"batch_size": batch_size, "rows": len(texts)})
            raise RuntimeError("FinBERT prediction failed") from exc
        predictions: list[SentimentPrediction] = []
        for row in outputs:
            probs = {item["label"].lower(): float(item["score"]) for item in row}
            label = max(probs, key=probs.get)
            signed = probs.get("positive", 0.0) - probs.get("negative", 0.0)
            predictions.append(
                SentimentPrediction(
                    sentiment_label=label,
                    sentiment_score=signed,
                    positive_probability=probs.get("positive", 0.0),
                    neutral_probability=probs.get("neutral", 0.0),
                    negative_probability=probs.get("negative", 0.0),
                )
            )
        return predictions

    def _heuristic_predict(self, text: str) -> SentimentPrediction:
        positive_terms = {"beat", "beats", "surge", "growth", "profit", "strong", "bull", "gain", "gains"}
        negative_terms = {"loss", "miss", "misses", "drop", "falls", "weak", "bear", "risk", "decline"}
        tokens = {token.strip(".,!?;:()[]{}\"' ").lower() for token in text.split()}
        pos_hits = len(tokens & positive_terms)
        neg_hits = len(tokens & negative_terms)
        score = float(max(-1.0, min(1.0, (pos_hits - neg_hits) / 3.0)))
        if score > 0.15:
            label = "positive"
        elif score < -0.15:
            label = "negative"
        else:
            label = "neutral"
        positive_probability = max(0.0, score)
        negative_probability = max(0.0, -score)
        neutral_probability = 1.0 - min(1.0, abs(score))
        return SentimentPrediction(
            sentiment_label=label,
            sentiment_score=score,
            positive_probability=positive_probability,
            neutral_probability=neutral_probability,
            negative_probability=negative_probability,
        )

    def enrich_news_frame(self, news_df: pd.DataFrame) -> pd.DataFrame:
        """Add sentiment columns to a news dataframe."""

        if news_df.empty:
            return news_df.copy()

        frame = news_df.copy().reset_index(drop=True)
        texts = [f"{row.headline}. {row.snippet or ''}".strip() for row in frame.itertuples(index=False)]
        preds = self.predict_batch(texts)
        frame["sentiment_label"] = [item.sentiment_label for item in preds]
        frame["sentiment_score"] = [item.sentiment_score for item in preds]
        frame["positive_probability"] = [item.positive_probability for item in preds]
        frame["neutral_probability"] = [item.neutral_probability for item in preds]
        frame["negative_probability"] = [item.negative_probability for item in preds]
        frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce")
        return frame

    def aggregate_daily_sentiment_frame(self, enriched_news_df: pd.DataFrame, rolling_window: int = 5) -> pd.DataFrame:
        """Aggregate a news dataframe into daily sentiment features."""

        if enriched_news_df.empty:
            return pd.DataFrame(
                columns=[
                    "date",
                    "mean_sentiment",
                    "std_sentiment",
                    "positive_count",
                    "negative_count",
                    "neutral_count",
                    "rolling_sentiment_mean",
                    "rolling_sentiment_std",
                    "sentiment_shock",
                ]
            )

        frame = enriched_news_df.copy()
        frame["date"] = pd.to_datetime(frame["timestamp"], errors="coerce").dt.floor("D")
        frame = frame.dropna(subset=["date"])
        daily = (
            frame.groupby("date", as_index=False)
            .agg(
                mean_sentiment=("sentiment_score", "mean"),
                std_sentiment=("sentiment_score", "std"),
                positive_count=("sentiment_label", lambda x: (x.str.lower() == "positive").sum()),
                negative_count=("sentiment_label", lambda x: (x.str.lower() == "negative").sum()),
                neutral_count=("sentiment_label", lambda x: (x.str.lower() == "neutral").sum()),
            )
            .sort_values("date")
        )
        daily["std_sentiment"] = daily["std_sentiment"].fillna(0.0)
        daily["rolling_sentiment_mean"] = daily["mean_sentiment"].rolling(rolling_window, min_periods=1).mean()
        daily["rolling_sentiment_std"] = daily["mean_sentiment"].rolling(rolling_window, min_periods=1).std().fillna(0.0)
        daily["sentiment_shock"] = daily["mean_sentiment"] - daily["rolling_sentiment_mean"]
        return daily

    def enrich_news_with_sentiment(self, session: Session, ticker: str) -> None:
        """Read unlabeled news, run FinBERT, and store sentiment records."""

        articles = (
            session.execute(
                select(NewsArticle)
                .where(NewsArticle.ticker == ticker)
                .order_by(NewsArticle.published_at.asc())
            )
            .scalars()
            .all()
        )
        if not articles:
            logger.warning("No news articles found for ticker", extra={"ticker": ticker})
            return

        text_batch = [f"{a.headline}. {a.snippet or ''}".strip() for a in articles]
        preds = self.predict_batch(text_batch)
        for article, pred in zip(articles, preds, strict=True):
            existing = session.execute(
                select(SentimentResult).where(SentimentResult.article_id == article.id)
            ).scalar_one_or_none()
            if existing:
                existing.sentiment_label = pred.sentiment_label
                existing.sentiment_score = pred.sentiment_score
                existing.positive_probability = pred.positive_probability
                existing.neutral_probability = pred.neutral_probability
                existing.negative_probability = pred.negative_probability
            else:
                session.add(
                    SentimentResult(
                        article_id=article.id,
                        sentiment_label=pred.sentiment_label,
                        sentiment_score=pred.sentiment_score,
                        positive_probability=pred.positive_probability,
                        neutral_probability=pred.neutral_probability,
                        negative_probability=pred.negative_probability,
                    )
                )
        logger.info("Sentiment enrichment completed", extra={"ticker": ticker, "rows": len(articles)})

    def aggregate_daily_sentiment(self, session: Session, ticker: str, rolling_window: int = 5) -> pd.DataFrame:
        """Aggregate article sentiment to daily sentiment features."""

        rows = session.execute(
            select(
                NewsArticle.published_at,
                SentimentResult.sentiment_label,
                SentimentResult.sentiment_score,
            ).join(SentimentResult, SentimentResult.article_id == NewsArticle.id)
            .where(NewsArticle.ticker == ticker)
        ).all()

        if not rows:
            logger.warning("No sentiment rows available for aggregation", extra={"ticker": ticker})
            return pd.DataFrame(
                columns=[
                    "date",
                    "mean_sentiment",
                    "std_sentiment",
                    "positive_count",
                    "negative_count",
                    "neutral_count",
                    "rolling_sentiment_mean",
                    "rolling_sentiment_std",
                    "sentiment_shock",
                ]
            )

        frame = pd.DataFrame(rows, columns=["published_at", "sentiment_label", "sentiment_score"])
        frame["date"] = pd.to_datetime(frame["published_at"]).dt.floor("D")

        daily = (
            frame.groupby("date", as_index=False)
            .agg(
                mean_sentiment=("sentiment_score", "mean"),
                std_sentiment=("sentiment_score", "std"),
                positive_count=("sentiment_label", lambda x: (x.str.lower() == "positive").sum()),
                negative_count=("sentiment_label", lambda x: (x.str.lower() == "negative").sum()),
                neutral_count=("sentiment_label", lambda x: (x.str.lower() == "neutral").sum()),
            )
            .sort_values("date")
        )

        daily["std_sentiment"] = daily["std_sentiment"].fillna(0.0)
        daily["rolling_sentiment_mean"] = daily["mean_sentiment"].rolling(rolling_window, min_periods=1).mean()
        daily["rolling_sentiment_std"] = daily["mean_sentiment"].rolling(rolling_window, min_periods=1).std().fillna(0.0)
        daily["sentiment_shock"] = daily["mean_sentiment"] - daily["rolling_sentiment_mean"]
        logger.info("Daily sentiment aggregation completed", extra={"ticker": ticker, "rows": len(daily)})
        return daily


if __name__ == "__main__":
    service = FinBertSentimentService()
    sample = ["Apple beats earnings estimates with strong iPhone sales."]
    preds = service.predict_batch(sample)
    logger.info("FinBERT example completed", extra={"predictions": len(preds)})
    print(preds[0])
