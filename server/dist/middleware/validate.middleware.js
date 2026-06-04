"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMiddleware = void 0;
const zod_1 = require("zod");
const validateMiddleware = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        return res.status(500).json({ message: 'Internal server error during validation' });
    }
};
exports.validateMiddleware = validateMiddleware;
exports.default = exports.validateMiddleware;
