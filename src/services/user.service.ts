import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { hashPassword } from '../utils/password.utils';
import { UserRole, User } from '../entities/user.entity';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, updateData: UpdateProfileData): Promise<User> {
    // Check if user exists
    const user = await this.getUserById(userId);

    // If email is being updated, check if it's already in use
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await userRepository.findByEmail(updateData.email);
      if (existingUser) {
        throw new AppError('Email is already in use', 400);
      }
    }

    // Update user fields
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;

    // Save updated user
    return await userRepository.save(user);
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(email: string): Promise<string> {
    // Find user by email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('There is no user with this email address', 404);
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to database
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration (10 minutes)
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Save user
    await userRepository.save(user);

    return resetToken;
  }

  /**
   * Reset password
   */
  async resetPassword(resetData: ResetPasswordData): Promise<void> {
    // Hash the token from the URL
    const hashedToken = crypto.createHash('sha256').update(resetData.token).digest('hex');

    // Find user with this token and check if token is still valid
    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now()),
      },
    });

    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    // Update user password
    user.passwordDigest = await hashPassword(resetData.password);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save updated user
    await userRepository.save(user);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    // Check if user exists
    const user = await this.getUserById(userId);

    // Update role
    user.role = role;

    // Save updated user
    return await userRepository.save(user);
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    return await userRepository.find();
  }
}

// Export a singleton instance
export const userService = new UserService();
