"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Hash a password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
const hashPassword = async (password) => {
    try {
        // Use a salt round of 12 for good security while keeping reasonable performance
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        return hashedPassword;
    }
    catch (error) {
        logger_1.default.error('Error hashing password:', error);
        throw new Error('Password hashing failed');
    }
};
exports.hashPassword = hashPassword;
/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password to compare
 * @param hashedPassword Hashed password to compare against
 * @returns Boolean indicating if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
    try {
        const isMatch = await bcryptjs_1.default.compare(password, hashedPassword);
        return isMatch;
    }
    catch (error) {
        logger_1.default.error('Error comparing passwords:', error);
        throw new Error('Password comparison failed');
    }
};
exports.comparePassword = comparePassword;
