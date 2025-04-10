import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { User, UserRole } from '../entities/user.entity';

// Extend Request interface to include user
interface AuthRequest extends Request {
  user?: User;
}

export class UserController {
  /**
   * Get current user profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // User should be attached to request by auth middleware
      if (!req.user) {
        return next(new AppError('Not authorized', 401));
      }

      const user = await userService.getUserById(req.user.id);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // User should be attached to request by auth middleware
      if (!req.user) {
        return next(new AppError('Not authorized', 401));
      }

      const updatedUser = await userService.updateProfile(req.user.id, req.body);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: updatedUser.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Create reset token
      const resetToken = await userService.createPasswordResetToken(email);

      // In a real application, you would send an email with the reset link
      // For this example, we'll just return the token in the response (not secure for production)
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      logger.info(`Password reset token created for ${email}`);

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
        // Only include this in development environment
        ...(process.env.NODE_ENV === 'development' && {
          resetURL,
          token: resetToken,
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      await userService.resetPassword({ token, password });

      res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();

      // Map users to remove sensitive information
      const safeUsers = users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }));

      res.status(200).json({
        status: 'success',
        results: safeUsers.length,
        data: {
          users: safeUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        return next(new AppError('Invalid user ID', 400));
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const { role } = req.body;

      if (isNaN(userId)) {
        return next(new AppError('Invalid user ID', 400));
      }

      const updatedUser = await userService.updateUserRole(userId, role as UserRole);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: updatedUser.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export a singleton instance
export const userController = new UserController();
