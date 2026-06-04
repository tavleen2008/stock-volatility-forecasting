"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./config/passport"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const news_routes_1 = __importDefault(require("./modules/news/news.routes"));
const stock_routes_1 = __importDefault(require("./modules/stocks/stock.routes"));
const forecast_routes_1 = __importDefault(require("./modules/forecasts/forecast.routes"));
const health_routes_1 = __importDefault(require("./modules/health/health.routes"));
const market_routes_1 = __importDefault(require("./modules/market/market.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const request_logger_middleware_1 = __importDefault(require("./middleware/request-logger.middleware"));
const env_1 = __importDefault(require("./config/env"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.default.frontendUrl || 'http://localhost:5173',
    credentials: true,
}));
app.use((0, morgan_1.default)(env_1.default.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use(request_logger_middleware_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/news', news_routes_1.default);
app.use('/api/stocks', stock_routes_1.default);
app.use('/api/forecasts', forecast_routes_1.default);
app.use('/api/market', market_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/health', health_routes_1.default);
app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.use(error_middleware_1.default);
exports.default = app;
