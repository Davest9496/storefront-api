import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { userRepository } from '../repositories/user.repository';
import logger from '../utils/logger';
import { User, UserRole } from '../entities/user.entity';

// Define a custom interface that extends Express Request
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to protect routes that require authentication
 */
export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1) Get token from authorization header
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      // Also check for token in cookies if using cookie-based authentication
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

      // 3) Check if user still exists
      const userId = typeof decoded.id === 'number' ? decoded.id : parseInt(decoded.id, 10);
      const currentUser = await userRepository.findOne({ where: { id: userId } });

      if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
      }

      // 4) Set user on request object
      req.user = currentUser;
      next();
    } catch (error) {
      logger.error('JWT verification error:', error);
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to certain roles
 * Accepts either enum values or string representations of roles
 */
export const restrictTo = (
  ...roles: (UserRole | string)[]
): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // First check if user exists on the request
    if (!req.user) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Check if user role is included in the allowed roles
    const roleMatches = roles.some(
      (role) =>
        // Handle both enum values and string representations
        req.user?.role === role || req.user?.role === UserRole[role as keyof typeof UserRole],
    );

    if (!roleMatches) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
