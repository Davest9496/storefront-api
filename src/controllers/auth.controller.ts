import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { User } from '../entities/user.entity';
import { validate } from 'class-validator';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Create new user
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    // Hash password
    user.passwordDigest = await hashPassword(password);

    // Validate user data
    const errors = await validate(user);
    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      return next(new AppError(`Validation failed: ${errorMessages}`, 400));
    }

    // Save user to database
    await userRepository.save(user);

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { passwordDigest: _passwordDigest, ...userWithoutPassword } = user;

    // Send response
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    logger.error('Error in signup:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check if user exists & password is correct
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user || !(await comparePassword(password, user.passwordDigest))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const { passwordDigest: _passwordDigest, ...userWithoutPassword } = user;

    // Send response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    logger.error('Error in login:', error);
    next(error);
  }
};

/**
 * @desc    Logout user (clear cookie if using cookie auth)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = (_req: Request, res: Response): void => {
  // If using cookies, clear the cookie
  if (res.clearCookie) {
    res.clearCookie('jwt');
  }

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // User is already attached to req by the auth middleware
    const user = req.user;

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PATCH /api/auth/update-password
 * @access  Private
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user from database with password
    const user = await userRepository.findByEmailWithPassword((req.user as User).email);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if current password is correct
    if (!(await comparePassword(currentPassword, user.passwordDigest))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.passwordDigest = await hashPassword(newPassword);
    await userRepository.save(user);

    // Generate new token
    const token = generateToken(user);

    // Send response
    res.status(200).json({
      status: 'success',
      token,
      message: 'Password updated successfully',
    });
  } catch (error) {
    logger.error('Error updating password:', error);
    next(error);
  }
};
