"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class UserController {
    /**
     * Get current user profile
     */
    async getProfile(req, res, next) {
        try {
            // User should be attached to request by auth middleware
            if (!req.user) {
                return next(new error_middleware_1.AppError('Not authorized', 401));
            }
            const user = await user_service_1.userService.getUserById(req.user.id);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update current user profile
     */
    async updateProfile(req, res, next) {
        try {
            // User should be attached to request by auth middleware
            if (!req.user) {
                return next(new error_middleware_1.AppError('Not authorized', 401));
            }
            const updatedUser = await user_service_1.userService.updateProfile(req.user.id, req.body);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Request password reset
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            // Create reset token
            const resetToken = await user_service_1.userService.createPasswordResetToken(email);
            // In a real application, you would send an email with the reset link
            // For this example, we'll just return the token in the response (not secure for production)
            const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
            logger_1.default.info(`Password reset token created for ${email}`);
            res.status(200).json({
                status: 'success',
                message: 'Token sent to email',
                // Only include this in development environment
                ...(process.env.NODE_ENV === 'development' && {
                    resetURL,
                    token: resetToken,
                }),
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reset password with token
     */
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            await user_service_1.userService.resetPassword({ token, password });
            res.status(200).json({
                status: 'success',
                message: 'Password has been reset successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all users (admin only)
     */
    async getAllUsers(req, res, next) {
        try {
            const users = await user_service_1.userService.getAllUsers();
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get user by ID (admin only)
     */
    async getUserById(req, res, next) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (isNaN(userId)) {
                return next(new error_middleware_1.AppError('Invalid user ID', 400));
            }
            const user = await user_service_1.userService.getUserById(userId);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update user role (admin only)
     */
    async updateUserRole(req, res, next) {
        try {
            const userId = parseInt(req.params.id, 10);
            const { role } = req.body;
            if (isNaN(userId)) {
                return next(new error_middleware_1.AppError('Invalid user ID', 400));
            }
            const updatedUser = await user_service_1.userService.updateUserRole(userId, role);
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
// Export a singleton instance
exports.userController = new UserController();
