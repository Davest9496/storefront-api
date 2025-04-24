import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppDataSource } from '../config/data-source';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import { User } from '../entities/user.entity';

// Extend Request interface to include user
interface AuthRequest extends Request {
  user?: User;
}

export class AuthController {
  /**
   * Register a new user
   */
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check database connection first
      if (!AppDataSource.isInitialized) {
        logger.error('Database not initialized during signup attempt');
        return next(new AppError('Service temporarily unavailable', 503));
      }

      const { user, token } = await authService.signup({
        firstName,
        lastName,
        email,
        password,
      });

      res.status(201).json({
        status: 'success',
        token,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      logger.error('Error in signup:', error);
      next(error);
    }
  }

  async testAuth(req: Request, res: Response): Promise<void> {
    try {
      // Simple no-database test to verify API Gateway and Lambda are working
      res.status(200).json({
        status: 'success',
        message: 'Auth service is available',
        database: AppDataSource.isInitialized ? 'connected' : 'not connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }

  /**
   * Login a user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const { user, token } = await authService.login(email, password);

      res.status(200).json({
        status: 'success',
        token,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // User should be attached to request by auth middleware
      if (!req.user) {
        return next(new AppError('Not authorized', 401));
      }

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            role: req.user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout a user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // If using cookie-based authentication, clear the cookie
      if (req.cookies?.jwt) {
        res.cookie('jwt', 'loggedout', {
          expires: new Date(Date.now() + 10 * 1000),
          httpOnly: true,
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export a singleton instance
export const authController = new AuthController();
