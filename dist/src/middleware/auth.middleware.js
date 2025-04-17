"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
const user_repository_1 = require("../repositories/user.repository");
const logger_1 = __importDefault(require("../utils/logger"));
const user_entity_1 = require("../entities/user.entity");
/**
 * Middleware to protect routes that require authentication
 */
const protect = async (req, res, next) => {
    try {
        // 1) Get token from authorization header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies?.jwt) {
            // Also check for token in cookies if using cookie-based authentication
            token = req.cookies.jwt;
        }
        if (!token) {
            return next(new error_middleware_1.AppError('You are not logged in. Please log in to get access.', 401));
        }
        // 2) Verify token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // 3) Check if user still exists
            const userId = typeof decoded.id === 'number' ? decoded.id : parseInt(decoded.id, 10);
            const currentUser = await user_repository_1.userRepository.findOne({ where: { id: userId } });
            if (!currentUser) {
                return next(new error_middleware_1.AppError('The user belonging to this token no longer exists.', 401));
            }
            // 4) Set user on request object
            req.user = currentUser;
            next();
        }
        catch (error) {
            logger_1.default.error('JWT verification error:', error);
            return next(new error_middleware_1.AppError('Invalid token. Please log in again.', 401));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
/**
 * Middleware to restrict access to certain roles
 * Accepts either enum values or string representations of roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // First check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('You are not logged in. Please log in to get access.', 401));
        }
        // Check if user role is included in the allowed roles
        const roleMatches = roles.some((role) => 
        // Handle both enum values and string representations
        req.user?.role === role || req.user?.role === user_entity_1.UserRole[role]);
        if (!roleMatches) {
            return next(new error_middleware_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
