# Server API Endpoints

This document lists the HTTP endpoints provided by the server, grouped by route prefix, with a short description and the controller that handles each route.

> Server entry: [server/src/app.ts](server/src/app.ts#L1)

---

## Root

- GET `/` — Health check root, returns `{ status: 'ok' }`.
  - File: [server/src/app.ts](server/src/app.ts#L1)

---

## Auth (/api/auth)

- POST `/api/auth/register/send-code` — Send OTP for new registration (stores pending user in Redis, emails code).
  - Controller: `sendVerificationCode`
  - Routes: [server/src/modules/auth/auth.routes.ts](server/src/modules/auth/auth.routes.ts#L1)
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L1)

- POST `/api/auth/register/verify` (alias: POST `/api/auth/verify`) — Verify OTP and create user; issues access + refresh tokens.
  - Controller: `verifyRegistration`
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L60)

- POST `/api/auth/register/resend-code` — Resend OTP for pending registration.
  - Controller: `resendCode`
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L100)

- POST `/api/auth/login` — Login with email/password; returns access token and sets refresh cookie.
  - Controller: `login`
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L120)

- POST `/api/auth/refresh` — Refresh access token using HttpOnly refresh cookie.
  - Controller: `refresh`
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L140)

- POST `/api/auth/logout` — Revoke refresh token and clear cookie.
  - Controller: `logout`
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L160)

- GET `/api/auth/google` and `/api/auth/google/callback` — Google OAuth endpoints via Passport.
  - Routes: [server/src/modules/auth/auth.routes.ts](server/src/modules/auth/auth.routes.ts#L1)
  - Passport config: [server/src/config/passport.ts](server/src/config/passport.ts#L1)

- GET `/api/auth/me` — Protected route, returns authenticated user profile. Requires auth middleware.
  - Controller: `me`
  - Controller: [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts#L20)

---

## Users (/api/users)

- GET `/api/users/` — (Placeholder) returns `{ users: [] }`.
  - Controller: `getUsers`
  - File: [server/src/modules/users/user.routes.ts](server/src/modules/users/user.routes.ts#L1)
  - Controller: [server/src/modules/users/user.controller.ts](server/src/modules/users/user.controller.ts#L1)

---

## News (/api/news)

- GET `/api/news` — Fetch latest news articles from DB (supports `limit` and `page` query params).
  - Controller: `fetchNewsController`
  - File: [server/src/modules/news/news.routes.ts](server/src/modules/news/news.routes.ts#L1)
  - Controller: [server/src/modules/news/news.controller.ts](server/src/modules/news/news.controller.ts#L1)

- GET `/api/news/:symbol` — Fetch news articles for a specific stock symbol (DB-backed).
  - Controller: `fetchNewsController`

---

## Stocks (/api/stocks)

- GET `/api/stocks` — List tracked stocks with live quotes.
  - Controller: `listStocks`
  - File: [server/src/modules/stocks/stock.routes.ts](server/src/modules/stocks/stock.routes.ts#L1)
  - Controller: [server/src/modules/stocks/stock.controller.ts](server/src/modules/stocks/stock.controller.ts#L1)

- GET `/api/stocks/:symbol` and `/api/stocks/:symbol/metrics` — Single-stock metrics (current price, day high/low, volume, etc.).
  - Controller: `getStockMetrics`

- GET `/api/stocks/:symbol/history?range=` — OHLCV history for charting. `range` defaults to `1mo`.
  - Controller: `getStockHistory`

- GET `/api/stocks/:symbol/dashboard` — Combined dashboard payload (metrics + news + forecast).
  - Controller: `getStockDashboard`

---

## Forecasts (/api/forecasts)

### Phase 1: Core Functionality (Start Here)

- GET `/api/forecasts/:symbol/latest`
  - **Purpose:** Fetch the most recent detailed forecast for a specific ticker.
  - **Response:** The exact comprehensive JSON payload provided by the ML model.

- GET `/api/forecasts/:symbol/history`
  - **Purpose:** Fetch a time-series of past forecasts.
  - **Query Params:** `days` (e.g., 7, 30).
  - **Use Case:** Plot a chart overlaying forecast_volatility with average_sentiment over time.

- GET `/stocks/:symbol/forecast/summary`
  - **Purpose:** Return an LLM-friendly summary of the forecast.

### Phase 2: Validation & Trust

- GET `/api/forecasts/:symbol/accuracy`
  - **Purpose:** Compares historical predicted volatility against the actual realized volatility/price data over a given time period.
  - **Query Params:** `days` (e.g., 30, 90) to define the time period.
  - **Response:** Returns an array containing the `real_historical_data` (e.g. OHLCV, actual volatility) aligned with the `forecast_history`, along with an overall `accuracy_score`.
  - **Use Case:** Crucial for building trust with the user via a dual-axis chart.

- GET `/api/forecasts/:symbol/news-impact`
  - **Purpose:** Extract just the top_news and sentiment_features.
  - **Use Case:** Powers a dedicated UI widget showing the driving forces behind the volatility.

### Phase 3: Macro & Discovery

- GET `/api/forecasts/screener`
  - **Purpose:** Filter and screen stocks based on forecast volatility and sentiment.
  - **Routes:** [server/src/modules/forecasts/forecast.routes.ts](server/src/modules/forecasts/forecast.routes.ts#L1)
  - **Controller:** [server/src/modules/forecasts/forecast.controller.ts](server/src/modules/forecasts/forecast.controller.ts#L1)
  - **Logic:** Uses `ML/scripts/forecast_api.py` which calls the full pipeline for each symbol.

- GET `/api/market/mood`
  - **Purpose:** Return the overall market sentiment and volatility index based on a composite of all tracked stocks.

- GET `/api/dashboard/home`
  - **Purpose:** Provide a high-level overview for the main dashboard.

- GET `/api/forecasts/opportunities`
  - **Purpose:** Return the most interesting stocks of the day based on a calculated volatility score.

### Phase 4: Advanced Interactivity (The "Crazy" Features)

- POST `/api/forecasts/:symbol/simulate`
  - **Purpose:** A "What-If" engine.
  - **Body:** `{ "hypothetical_sentiment": 0.9, "mock_headline": "Apple invents teleportation" }`
  - **Use Case:** Allows users to input hypothetical scenarios to see how the model's forecast would react.

- GET `/api/forecasts/:symbol/backtest`
  - **Purpose:** Shows if the model is profitable by simulating trades based on its predictions.
  - **Query Params:** `days` (e.g., 90).
  - **Use Case:** "If I bought AAPL every time the model predicted high volatility and positive sentiment, what would my return be?" Translates ML accuracy directly into dollar signs.

- POST `/api/forecasts/alerts`
  - **Purpose:** Subscribe to a notification when a stock meets certain forecast criteria.
  - **Body:** `{ "symbol": "AAPL", "condition": "volatility_greater_than", "threshold": 0.20 }`
  - **Use Case:** "Email me when AAPL's predicted volatility spikes above 20%."

- GET `/api/forecasts/alerts`
  - **Purpose:** List all active alerts for the authenticated user.

---

## Health (/api/health)

- GET `/api/health` — Service health endpoint returning `{ status: 'healthy' }`.
  - Controller: `health`
  - File: [server/src/modules/health/health.routes.ts](server/src/modules/health/health.routes.ts#L1)

---

## Notes & suggestions

- Authentication: `authMiddleware` protects routes that require a valid access token (see middleware files). Google OAuth is configured in [server/src/config/passport.ts](server/src/config/passport.ts#L1).
- Data sources: stock data is fetched via Yahoo Finance (see `server/src/modules/stocks/stock.service.ts`); forecasts use the server `ForecastService`.
- If you want a machine-readable export (JSON/OpenAPI) or an endpoint that returns this routes inventory, I can add `/api/openapi.json` or `/api/routes`.

---

Generated: automatically by developer tooling.
