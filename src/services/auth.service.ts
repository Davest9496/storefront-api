import { userRepository } from '../repositories/user.repository';
import { User, UserRole } from '../entities/user.entity';
import { AppError } from '../middleware/error.middleware';
import { hashPassword, comparePassword } from '../utils/password.utils';
import logger from '../utils/logger';
import { generateToken } from '../utils/jwt.utils';
import { AppDataSource } from '../config/data-source';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResult {
  user: User;
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async signup(signupData: SignupData): Promise<AuthResult> {
    // Check if user with this email already exists
    const existingUser = await userRepository.findByEmail(signupData.email);

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    // Create new user
    const newUser = userRepository.create({
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      email: signupData.email,
      passwordDigest: await hashPassword(signupData.password),
      role: signupData.role || UserRole.CUSTOMER,
    });

    // Save user to database
    const user = await userRepository.save(newUser);

    // Generate JWT token
    const token = generateToken(user);

    return { user, token };
  }

  /**
   * Login a user
   */
  // src/services/auth.service.ts - Enhance error reporting
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      logger.info(`Login attempt for: ${email}`);

      // Check database connection first
      if (!AppDataSource.isInitialized) {
        logger.error('Database not initialized during login attempt');
        throw new AppError('Service temporarily unavailable', 503);
      }

      // Find user by email and include password
      const user = await userRepository.findByEmailWithPassword(email);

      if (!user) {
        logger.info(`Login failed: User not found: ${email}`);
        throw new AppError('Incorrect email or password', 401);
      }

      logger.info(`User found, verifying password for: ${email}`);

      // Check if password is correct
      const isPasswordValid = await comparePassword(password, user.passwordDigest);

      if (!isPasswordValid) {
        logger.info(`Login failed: Invalid password for: ${email}`);
        throw new AppError('Incorrect email or password', 401);
      }

      logger.info(`Login successful for: ${email}`);

      // Generate JWT token
      const token = generateToken(user);

      return { user, token };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(`Login error:`, error);
      throw new AppError('Authentication failed', 500);
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();
