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

// Custom interface for errors with code property
interface DatabaseError extends Error {
  code?: string | number;
  detail?: string;
  keyValue?: Record<string, unknown>;
}

// Interface for validation errors
interface ValidationError extends Error {
  errors?: Record<string, { message: string }>;
}

/**
 * Global error handling middleware
 */
const errorMiddleware = (
  err: Error | DatabaseError | ValidationError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const customError = err as AppError;
  customError.statusCode = customError.statusCode || 500;
  customError.status = customError.status || 'error';

  // Log the error
  logger.error(
    `${customError.statusCode} - ${customError.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );

  if (customError.stack) {
    logger.debug(customError.stack);
  }

  // Different error handling based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(customError, res);
  } else {
    let error = { ...customError } as AppError;
    error.message = customError.message;
    error.status = customError.status;
    error.statusCode = customError.statusCode;

    // Handle specific error types
    const dbError = err as DatabaseError;

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
      const validationError = err as ValidationError;
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

export default errorMiddleware;
