# News Sentiment Based Stock Volatility Forecasting

This project contains a production-grade quantitative ML pipeline that forecasts stock volatility by combining market microstructure signals and financial-news sentiment.

## Folder Structure

```text
project_root/
	ml/
		data/
		nlp/
		features/
		models/
			harnet/
			lstm/
		evaluation/
		pipelines/
		mlops/
			great_expectations/
			evidently/
	requirements.txt
	pyproject.toml
	.env.example
```

## Quick Start

```bash
cd quant_pipeline
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Populate `.env` based on `.env.example` and run:

```bash
python -m ml.pipelines.train_pipeline
```

## Workflow

1. Load config from environment.
2. Download market data and compute realized variance/volatility.
3. Fetch and store financial news from NewsAPI.
4. Infer article sentiment with FinBERT.
5. Build market + sentiment features.
6. Train and compare statistical, ML, and deep models.
7. Evaluate forecasts and export reports.
8. Track runs in MLflow and generate drift reports with Evidently.
