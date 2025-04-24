"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const user_entity_1 = require("../entities/user.entity");
const error_middleware_1 = require("../middleware/error.middleware");
const password_utils_1 = require("../utils/password.utils");
const logger_1 = __importDefault(require("../utils/logger"));
const jwt_utils_1 = require("../utils/jwt.utils");
const data_source_1 = require("../config/data-source");
class AuthService {
    /**
     * Register a new user
     */
    async signup(signupData) {
        // Check if user with this email already exists
        const existingUser = await user_repository_1.userRepository.findByEmail(signupData.email);
        if (existingUser) {
            throw new error_middleware_1.AppError('Email already in use', 400);
        }
        // Create new user
        const newUser = user_repository_1.userRepository.create({
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            passwordDigest: await (0, password_utils_1.hashPassword)(signupData.password),
            role: signupData.role || user_entity_1.UserRole.CUSTOMER,
        });
        // Save user to database
        const user = await user_repository_1.userRepository.save(newUser);
        // Generate JWT token
        const token = (0, jwt_utils_1.generateToken)(user);
        return { user, token };
    }
    /**
     * Login a user
     */
    // src/services/auth.service.ts - Enhance error reporting
    async login(email, password) {
        try {
            logger_1.default.info(`Login attempt for: ${email}`);
            // Check database connection first
            if (!data_source_1.AppDataSource.isInitialized) {
                logger_1.default.error('Database not initialized during login attempt');
                throw new error_middleware_1.AppError('Service temporarily unavailable', 503);
            }
            // Find user by email and include password
            const user = await user_repository_1.userRepository.findByEmailWithPassword(email);
            if (!user) {
                logger_1.default.info(`Login failed: User not found: ${email}`);
                throw new error_middleware_1.AppError('Incorrect email or password', 401);
            }
            logger_1.default.info(`User found, verifying password for: ${email}`);
            // Check if password is correct
            const isPasswordValid = await (0, password_utils_1.comparePassword)(password, user.passwordDigest);
            if (!isPasswordValid) {
                logger_1.default.info(`Login failed: Invalid password for: ${email}`);
                throw new error_middleware_1.AppError('Incorrect email or password', 401);
            }
            logger_1.default.info(`Login successful for: ${email}`);
            // Generate JWT token
            const token = (0, jwt_utils_1.generateToken)(user);
            return { user, token };
        }
        catch (error) {
            if (error instanceof error_middleware_1.AppError) {
                throw error;
            }
            logger_1.default.error(`Login error:`, error);
            throw new error_middleware_1.AppError('Authentication failed', 500);
        }
    }
}
exports.AuthService = AuthService;
// Export a singleton instance
exports.authService = new AuthService();
