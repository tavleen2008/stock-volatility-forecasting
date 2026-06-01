"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorMiddleware;
function errorMiddleware(err, _req, res, _next) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
}
