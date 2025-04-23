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
    async login(email, password) {
        try {
            logger_1.default.info(`Attempting login for user: ${email}`);
            // Find user by email and include password
            const user = await user_repository_1.userRepository.findByEmailWithPassword(email);
            if (!user) {
                logger_1.default.info(`User not found: ${email}`);
                throw new error_middleware_1.AppError('Incorrect email or password', 401);
            }
            logger_1.default.info(`User found, checking password...`);
            logger_1.default.debug(`Stored password hash: ${user.passwordDigest.substring(0, 10)}...`);
            // Check if password is correct
            const isPasswordValid = await (0, password_utils_1.comparePassword)(password, user.passwordDigest);
            logger_1.default.info(`Password valid: ${isPasswordValid}`);
            if (!isPasswordValid) {
                throw new error_middleware_1.AppError('Incorrect email or password', 401);
            }
            // Generate JWT token
            const token = (0, jwt_utils_1.generateToken)(user);
            return { user, token };
        }
        catch (error) {
            logger_1.default.error('Error during login:', error);
            // Rethrow AppError instances, wrap other errors
            if (error instanceof error_middleware_1.AppError) {
                throw error;
            }
            throw new error_middleware_1.AppError('Authentication failed', 500);
        }
    }
}
exports.AuthService = AuthService;
// Export a singleton instance
exports.authService = new AuthService();
