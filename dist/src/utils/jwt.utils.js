"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Generate JWT token for authentication
 * @param user User object to generate token for
 * @returns JWT token string
 */
const generateToken = (user) => {
    try {
        // Make sure JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }
        // Create payload
        const payload = {
            id: user.id,
            email: user.email,
        };
        // Sign with proper typing for all parameters
        const token = jsonwebtoken_1.default.sign(payload, jwtSecret, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        });
        return token;
    }
    catch (error) {
        logger_1.default.error('Error generating JWT token:', error);
        throw new Error('Failed to generate authentication token');
    }
};
exports.generateToken = generateToken;
/**
 * Verify JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        // Make sure JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }
        // Verify with proper typing
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        return decoded;
    }
    catch (error) {
        logger_1.default.error('Error verifying JWT token:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
