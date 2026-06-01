"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const news_controller_1 = require("./news.controller");
const router = (0, express_1.Router)();
router.get('/', news_controller_1.fetchNewsController);
router.get('/:symbol', news_controller_1.fetchNewsController);
exports.default = router;
