"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controller_1 = require("./stock.controller");
const router = (0, express_1.Router)();
router.get('/', stock_controller_1.getStocks);
exports.default = router;
