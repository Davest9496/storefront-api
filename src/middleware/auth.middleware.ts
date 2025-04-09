import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { userRepository } from '../repositories/user.repository';
import logger from '../utils/logger';
import { User } from '../entities/user.entity';

// Define a custom interface that extends Express Request
interface AuthenticatedRequest extends Request {
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
 * Interface for user with role
 */
interface UserWithRole extends User {
  role: string;
}

/**
 * Type guard to check if user has a role property
 */
function hasRole(user: User): user is UserWithRole {
  return 'role' in user && typeof (user as UserWithRole).role === 'string';
}

/**
 * Middleware to restrict access to certain roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // First check if user exists on the request
    if (!req.user) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Check if user has a role property
    if (!hasRole(req.user)) {
      return next(new AppError('User role is not defined', 403));
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
