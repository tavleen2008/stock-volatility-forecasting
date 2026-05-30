"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forecast_controller_1 = require("./forecast.controller");
const router = (0, express_1.Router)();
router.post('/', forecast_controller_1.runForecast);
exports.default = router;
