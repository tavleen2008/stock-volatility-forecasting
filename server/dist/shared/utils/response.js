"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.success = void 0;
const success = (res, data, status = 200) => res.status(status).json({ success: true, data });
exports.success = success;
const error = (res, message = 'error', status = 500) => res.status(status).json({ success: false, message });
exports.error = error;
