import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom Error class with status code and isOperational flag
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle development errors with detailed information
 */
const sendErrorDev = (err: AppError, res: Response): void => {
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
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details
  } else {
    // Log error
    logger.error('ERROR 💥', err);

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

/**
 * Interface for database errors
 */
interface DatabaseError extends Error {
  code: string;
  detail?: string;
  keyValue?: Record<string, unknown>;
}

/**
 * Interface for validation errors
 */
interface ValidationError extends Error {
  errors: Record<string, { message: string }>;
}

/**
 * Type guard for DatabaseError
 */
function isDatabaseError(error: Error): error is DatabaseError {
  return 'code' in error;
}

/**
 * Type guard for ValidationError
 */
function isValidationError(error: Error): error is ValidationError {
  return error.name === 'ValidationError' && 'errors' in error;
}

/**
 * Global error handling middleware
 */
const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  let customError: AppError;

  if (err instanceof AppError) {
    customError = err;
  } else {
    customError = new AppError(err.message || 'Something went wrong', 500);
  }

  // Log the error
  logger.error(
    `${customError.statusCode} - ${customError.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );

  if (err.stack) {
    logger.debug(err.stack);
  }

  // Different error handling based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(customError, res);
  } else {
    // Handle specific error types

    // Duplicate key error (MongoDB)
    if (isDatabaseError(err) && err.code === '11000' && err.keyValue) {
      const field = Object.keys(err.keyValue)[0];
      const message = `Duplicate field value: ${field}. Please use another value!`;
      customError = new AppError(message, 400);
    }

    // PostgreSQL unique constraint error
    if (isDatabaseError(err) && err.code === '23505') {
      const field = err.detail?.match(/Key \((.*?)\)=/)?.[1] || 'field';
      const message = `Duplicate field value: ${field}. Please use another value!`;
      customError = new AppError(message, 400);
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
      const message = 'Your token has expired! Please log in again.';
      customError = new AppError(message, 401);
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token. Please log in again!';
      customError = new AppError(message, 401);
    }

    // Validation errors
    if (isValidationError(err)) {
      const errors = Object.values(err.errors).map((el) => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      customError = new AppError(message, 400);
    }

    sendErrorProd(customError, res);
  }
};

export default errorMiddleware;
