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

- POST `/api/forecasts` — Trigger a forecast run (currently a placeholder returning `{ forecast: null }`).
  - Controller: `runForecast`
  - File: [server/src/modules/forecasts/forecast.routes.ts](server/src/modules/forecasts/forecast.routes.ts#L1)

- GET `/api/forecasts/:symbol` — Return volatility forecast for a symbol computed by server-side logic.
  - Controller: `getForecastBySymbol`
  - Controller: [server/src/modules/forecasts/forecast.controller.ts](server/src/modules/forecasts/forecast.controller.ts#L1)
  - Forecast logic: [server/src/modules/forecasts/forecast.service.ts](server/src/modules/forecasts/forecast.service.ts#L1)

Notes: `ForecastService.getVolatilityForecast` currently computes SMA, RSI, annualized volatility and returns forward-looking ranges and a heuristic `signal` (not ML-based). See the service file for details.

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
