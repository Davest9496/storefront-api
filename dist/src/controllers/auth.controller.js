"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("../middleware/error.middleware");
class AuthController {
    /**
     * Register a new user
     */
    async signup(req, res, next) {
        try {
            const { firstName, lastName, email, password } = req.body;
            const { user, token } = await auth_service_1.authService.signup({
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Login a user
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { user, token } = await auth_service_1.authService.login(email, password);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current user
     */
    async getMe(req, res, next) {
        try {
            // User should be attached to request by auth middleware
            if (!req.user) {
                return next(new error_middleware_1.AppError('Not authorized', 401));
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logout a user
     */
    async logout(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
// Export a singleton instance
exports.authController = new AuthController();
