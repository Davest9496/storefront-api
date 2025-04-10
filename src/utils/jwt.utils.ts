import jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import logger from './logger';

/**
 * Generate JWT token for authentication
 * @param user User object to generate token for
 * @returns JWT token string
 */
export const generateToken = (user: User): string => {
  try {
    // Make sure JWT_SECRET exists
    const jwtSecret: jwt.Secret = process.env.JWT_SECRET as string;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    // Create payload
    const payload = {
      id: user.id,
      email: user.email,
    };

    // Sign with proper typing for all parameters
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    } as jwt.SignOptions);

    return token;
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    // Make sure JWT_SECRET exists
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    // Verify with proper typing
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    return null;
  }
};
