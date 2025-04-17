"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Custom Error class with status code and isOperational flag
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Handle development errors with detailed information
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
/**
 * Handle production errors with limited information
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        // Programming or other unknown error: don't leak error details
    }
    else {
        // Log error
        logger_1.default.error('ERROR 💥', err);
        // Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
};
/**
 * Global error handling middleware
 */
const errorMiddleware = (err, req, res, _next) => {
    const customError = err;
    customError.statusCode = customError.statusCode || 500;
    customError.status = customError.status || 'error';
    // Log the error
    logger_1.default.error(`${customError.statusCode} - ${customError.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if (customError.stack) {
        logger_1.default.debug(customError.stack);
    }
    // Different error handling based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(customError, res);
    }
    else {
        let error = { ...customError };
        error.message = customError.message;
        error.status = customError.status;
        error.statusCode = customError.statusCode;
        // Handle specific error types
        const dbError = err;
        // Duplicate key error (MongoDB)
        if (dbError.code === 11000) {
            const message = `Email already in use`;
            error = new AppError(message, 400);
        }
        // PostgreSQL unique constraint error
        if (dbError.code === '23505') {
            const message = `Email already in use`;
            error = new AppError(message, 400);
        }
        // JWT expired error
        if (err.name === 'TokenExpiredError') {
            const message = 'Your token has expired! Please log in again.';
            error = new AppError(message, 401);
        }
        // JWT error
        if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid token. Please log in again!';
            error = new AppError(message, 401);
        }
        // Validation errors (from Zod or express-validator)
        if (err.name === 'ValidationError' || err.name === 'ZodError') {
            let message = 'Invalid input data';
            const validationError = err;
            if (validationError.errors) {
                const errorMessages = Object.values(validationError.errors)
                    .map((el) => el.message)
                    .join('. ');
                message = `${message}. ${errorMessages}`;
            }
            error = new AppError(message, 400);
        }
        sendErrorProd(error, res);
    }
};
exports.default = errorMiddleware;
