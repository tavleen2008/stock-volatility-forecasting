# Stock Volatility Forecasting & Financial Analytics Platform

An end-to-end, enterprise-grade financial analytics and volatility forecasting application. This repository integrates a high-performance **Machine Learning / Quantitative Finance pipeline** (Python, FinBERT, HAR, XGBoost) with a modern **Web Platform** (React, Express, TypeScript, Redis, PostgreSQL, Docker).

---

## 🏛️ System Architecture

The platform consists of three core components working in unison:

```mermaid
graph TD
    subgraph Frontend [React Client]
        A[Dashboard & Charts] -->|HTTP Requests| B[Search & News Feed]
    end

    subgraph Backend [Express Server]
        C[Express Router] -->|Queries| D[(PostgreSQL via Prisma)]
        C -->|Session/OTP| E[(Redis Cache)]
        C -->|Live Price / History| F[Yahoo Finance API]
    end

    subgraph ML_Pipeline [Python Quant Pipeline]
        G[Data Loader] -->|Fetch Market Data| F
        G -->|Fetch News| H[NewsAPI]
        I[NLP Engine] -->|Sentiment Scoring| J[FinBERT Model]
        K[Feature Builder] -->|Extract Lags/Quarticity| L[(Data Stores)]
        M[Model Engine] -->|Train & Eval| N[HAR & XGBoost]
        N -->|Generate Predictions| O[Artifacts / Reports]
    end

    Frontend -->|API Gateway Port 5173/80| Backend
    ML_Pipeline -->|Populates Database / CSVs| Backend
```

1. **React Frontend (`/client`)**: A sleek, dark-themed dashboard presenting live quotes, news sentiment, interactive historical volatility charting (via Recharts), and profile verification.
2. **Express Backend (`/server`)**: A robust TypeScript REST API handling auth (Google OAuth, OTP verification via Redis), caching, and financial data aggregation from Yahoo Finance and the DB.
3. **ML Pipeline (`/ML`)**: A Python-based quant engineering suite that conducts news ingestion, FinBERT sentiment scoring, feature calculation, and volatility modeling (HAR-RV, HAR-Log, XGBoost, and sentiment-augmented variants).

---

## ✨ Features

### 🖥️ Web Application & Dashboard
*   **Dark Theme Professional UI**: Responsive panel layout tailored for financial analysts.
*   **Interactive Charting**: Custom historical price, volume, and volatility analytics with timeframe toggles (1D, 1W, 1M, 3M, 1Y).
*   **Real-time Stock Movers**: High-fidelity tables showing daily gainers/losers, volatility, and trading volumes.
*   **Two-Factor Authentication**: Email OTP confirmation flow supported by Redis cache, plus native Google OAuth integration.
*   **Global Market Search**: Real-time filter/search mechanism across indices, sectors, and assets.

### 📈 Quantitative ML & Forecasting Pipeline
*   **NLP News Sentiment**: High-quality sentence-level sentiment analysis on financial news using the pre-trained **FinBERT** model.
*   **Robust Volatility Modeling**:
    *   **HAR-RV (Heterogeneous Autoregressive Model)**: Volatility forecasting utilizing daily, weekly, and monthly realized volatility components.
    *   **HAR-Log**: A transformation-stabilized linear model with log-variance scaling.
    *   **XGB Baseline**: Optimized gradient boosted tree regression representing modern machine learning benchmarks.
    *   **Sentiment Augmentation**: Evaluation of model performance gains through news sentiment enrichment (HAR+Sentiment, XGB+Sentiment).
*   **Advanced Diagnostics & Auditing**:
    *   Rigorous mathematical validation (RMSE, MAE, $R^2$, Directional Accuracy, Correlation, and asymmetric **QLIKE** loss).
    *   Feature importance analysis, residual reports, and data drift monitoring using **Evidently** and **Great Expectations**.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, Lucide React, Nginx |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Passport.js, Redis, Nodemailer |
| **Database** | PostgreSQL |
| **Machine Learning (Python)** | PyTorch, Transformers (FinBERT), XGBoost, Scikit-learn, Pandas, NumPy, Arch, MLflow, Great Expectations, Evidently |
| **DevOps & Infrastructure** | Docker, Docker Compose |

---

## 📂 Project Structure

```text
stock-volatility-forecasting/
├── client/                     # React Frontend (Vite, CSS3/Tailwind)
│   ├── src/
│   │   ├── components/         # UI Elements (Sidebar, NewsFeed, StockComparison, Dashboard)
│   │   └── utils/              # API Clients and Helpers
│   └── Dockerfile              # Frontend Production Build (Nginx)
├── server/                     # Node.js + Express Server (TypeScript)
│   ├── src/
│   │   ├── modules/            # Domain-driven backend modules (Auth, Stocks, News, Forecasts)
│   │   ├── config/             # Passport, Database, and Mail configurations
│   │   └── utils/              # Email, Redis, and Token services
│   └── Dockerfile              # Backend dev/prod container environment
├── ML/                         # Python Quantitative ML Pipeline
│   └── quant_pipeline/
│       ├── ml/                 # Data, Models (HAR, XGBoost), NLP (FinBERT), Pipelines
│       ├── scripts/            # Pipeline execution, tuning, and report generation scripts
│       ├── requirements.txt    # Python dependencies
│       └── pyproject.toml      # Project configuration
├── docker-compose.yml          # Container orchestrator (Backend, Client, Redis)
└── research-paper.pdf          # Background literature & theoretical foundations
```

---

## 🚀 Getting Started

You can run the application stack either using **Docker Compose** (recommended for full stack setup) or by launching services **manually**.

### Option A: Quickstart with Docker Compose

Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed, then run:

```bash
docker compose up --build
```

This commands spins up:
1.  **Redis Cache** on port `6379`.
2.  **Express API Backend** on port `3000`.
3.  **Vite React Frontend** on port `5173` (Nginx).

---

### Option B: Manual Service Setup

#### 1. Redis Server
Ensure a local Redis instance is running on `127.0.0.1:6379`.

#### 2. Configure & Run Backend
Navigate to the server directory:
```bash
cd server
cp .env.example .env
```
Fill out the required `.env` values (especially `JWT_ACCESS_SECRET`, `REDIS_URL`, and SMTP details).

Install dependencies and start development server:
```bash
npm install
npm run dev
```

#### 3. Configure & Run Frontend
Navigate to the client directory:
```bash
cd client
npm install
npm start
```
Open `http://localhost:5173` in your browser.

#### 4. Run the Machine Learning Pipeline
Setup your python virtual environment inside the `ML/quant_pipeline` directory:
```bash
cd ML/quant_pipeline
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```
To run the full suite of data gathering, FinBERT NLP processing, modeling, evaluation, and plot rendering:
```bash
python scripts/complete_analysis.py
```

---

## ⚙️ Environment Variables

### Backend (`/server/.env`)
Create a `.env` file in the `/server` directory:

| Key | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | API Port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/stock_db` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret key for JWT access tokens | `your_secret_here` |
| `GOOGLE_CLIENT_ID` | OAuth Google Client ID | `your_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Google Client Secret | `your_secret` |
| `FRONTEND_URL` | URL of the UI client for redirects | `http://localhost:5173` |
| `SMTP_HOST` | Email server host (for OTP code emails) | `smtp.ethereal.email` |

---

## 📊 Pipeline Model Evaluation & Calibration

The project contains a built-in diagnostics reporter verifying that volatility forecasts match actual historical trends. During validation:
*   **HAR-Log Bug Correction**: The pipeline was calibrated to eliminate arbitrary value clipping in transformed log-variance domains, ensuring a clean, mathematically correct exponential inverse-transform back to realized volatility.
*   **Comparative Performance**: Metrics such as RMSE and QLIKE are calculated and saved under `artifacts/reports/` for benchmarking model architectures.
*   **News Sentiment Fallback**: If `NEWS_API_KEY` is not present, the NLP loader gracefully falls back to empty frames allowing standard HAR/XGB models to train without features blockages.

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
