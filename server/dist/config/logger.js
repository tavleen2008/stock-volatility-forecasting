"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Simple logger placeholder; replace with winston/pino in production
exports.logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
};
