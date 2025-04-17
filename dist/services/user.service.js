"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_repository_1 = require("../repositories/user.repository");
const error_middleware_1 = require("../middleware/error.middleware");
const password_utils_1 = require("../utils/password.utils");
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = await user_repository_1.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        return user;
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        // Check if user exists
        const user = await this.getUserById(userId);
        // If email is being updated, check if it's already in use
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await user_repository_1.userRepository.findByEmail(updateData.email);
            if (existingUser) {
                throw new error_middleware_1.AppError('Email is already in use', 400);
            }
        }
        // Update user fields
        if (updateData.firstName)
            user.firstName = updateData.firstName;
        if (updateData.lastName)
            user.lastName = updateData.lastName;
        if (updateData.email)
            user.email = updateData.email;
        // Save updated user
        return await user_repository_1.userRepository.save(user);
    }
    /**
     * Create password reset token
     */
    async createPasswordResetToken(email) {
        // Find user by email
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            throw new error_middleware_1.AppError('There is no user with this email address', 404);
        }
        // Create reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        // Hash token and save to database
        user.resetPasswordToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        // Set expiration (10 minutes)
        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
        // Save user
        await user_repository_1.userRepository.save(user);
        return resetToken;
    }
    /**
     * Reset password
     */
    async resetPassword(resetData) {
        // Hash the token from the URL
        const hashedToken = crypto_1.default.createHash('sha256').update(resetData.token).digest('hex');
        // Find user with this token and check if token is still valid
        const user = await user_repository_1.userRepository.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: new Date(Date.now()),
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('Token is invalid or has expired', 400);
        }
        // Update user password
        user.passwordDigest = await (0, password_utils_1.hashPassword)(resetData.password);
        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        // Save updated user
        await user_repository_1.userRepository.save(user);
    }
    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId, role) {
        // Check if user exists
        const user = await this.getUserById(userId);
        // Update role
        user.role = role;
        // Save updated user
        return await user_repository_1.userRepository.save(user);
    }
    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        return await user_repository_1.userRepository.find();
    }
}
exports.UserService = UserService;
// Export a singleton instance
exports.userService = new UserService();
