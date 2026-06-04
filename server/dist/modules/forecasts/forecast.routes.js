"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forecast_controller_1 = require("./forecast.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const forecast_schemas_1 = require("./forecast.schemas");
const router = (0, express_1.Router)();
// Phase 3: Macro & Discovery
router.get('/screener', (0, validate_middleware_1.validateMiddleware)(forecast_schemas_1.screenerQuerySchema), forecast_controller_1.getForecastScreener);
router.get('/opportunities', forecast_controller_1.getForecastOpportunities);
// Phase 1: Core Functionality
router.get('/:symbol/latest', (0, validate_middleware_1.validateMiddleware)(forecast_schemas_1.symbolParamSchema), forecast_controller_1.getLatestForecast);
router.get('/:symbol/history', (0, validate_middleware_1.validateMiddleware)(forecast_schemas_1.symbolAndRangeSchema), forecast_controller_1.getForecastHistory);
router.get('/:symbol/summary', (0, validate_middleware_1.validateMiddleware)(forecast_schemas_1.symbolParamSchema), forecast_controller_1.getForecastSummary);
// Phase 2: Validation & Trust
router.get('/:symbol/accuracy', (0, validate_middleware_1.validateMiddleware)(forecast_schemas_1.symbolAndRangeSchema), forecast_controller_1.getForecastAccuracy);
router.get('/:symbol/news-impact', (0, validate_middleware_1.validateMiddleware)(forecast_schemas_1.symbolParamSchema), forecast_controller_1.getForecastNewsImpact);
exports.default = router;
