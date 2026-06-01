"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMiddleware = void 0;
const validateMiddleware = (schema) => (req, res, next) => {
    // placeholder for validation logic
    next();
};
exports.validateMiddleware = validateMiddleware;
exports.default = exports.validateMiddleware;
