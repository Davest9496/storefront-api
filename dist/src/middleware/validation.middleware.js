"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const error_middleware_1 = require("./error.middleware");
/**
 * Middleware to validate request body against a Zod schema
 * @param schema Zod schema to validate against
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate request body against schema
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const errorMessage = result.error.errors
                    .map((error) => `${error.path.join('.')}: ${error.message}`)
                    .join('; ');
                return next(new error_middleware_1.AppError(`Validation error: ${errorMessage}`, 400));
            }
            // Replace req.body with validated and transformed data
            req.body = result.data;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
