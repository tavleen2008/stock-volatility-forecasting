"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, _res, next) => {
    // lightweight request logging
    console.log(`${req.method} ${req.originalUrl}`);
    next();
};
exports.requestLogger = requestLogger;
exports.default = exports.requestLogger;
