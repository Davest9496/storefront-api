"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestDatabase = setupTestDatabase;
exports.resetTestDatabase = resetTestDatabase;
exports.closeTestDatabase = closeTestDatabase;
exports.createTestUser = createTestUser;
exports.deleteTestUser = deleteTestUser;
// src/__tests__/helpers/db-helper.ts
const data_source_1 = require("../../config/data-source");
const user_entity_1 = require("../../entities/user.entity");
const password_utils_1 = require("../../utils/password.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Ensure database is initialized for tests
 */
async function setupTestDatabase() {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            process.env.NODE_ENV = 'test'; // Ensure we're in test mode
            await data_source_1.AppDataSource.initialize();
            logger_1.default.info('Test database initialized');
        }
    }
    catch (error) {
        logger_1.default.error('Failed to initialize test database:', error);
        throw error;
    }
}
/**
 * Reset the database to a clean state
 */
async function resetTestDatabase() {
    try {
        await (0, data_source_1.resetDatabase)();
        logger_1.default.info('Test database reset to clean state');
    }
    catch (error) {
        logger_1.default.error('Failed to reset test database:', error);
        throw error;
    }
}
/**
 * Close the database connection
 */
async function closeTestDatabase() {
    try {
        if (data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.destroy();
            logger_1.default.info('Test database connection closed');
        }
    }
    catch (error) {
        logger_1.default.error('Failed to close test database:', error);
        throw error;
    }
}
/**
 * Create a test user
 */
async function createTestUser(firstName = 'Test', lastName = 'User', email = 'test@example.com', password = 'TestPassword123!') {
    try {
        // Ensure database is initialized
        await setupTestDatabase();
        // Check if user already exists
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        let user = await userRepository.findOne({ where: { email } });
        if (user) {
            logger_1.default.info(`Test user ${email} already exists`);
            return user;
        }
        // Create new user
        user = new user_entity_1.User();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.passwordDigest = await (0, password_utils_1.hashPassword)(password);
        await userRepository.save(user);
        logger_1.default.info(`Test user ${email} created`);
        return user;
    }
    catch (error) {
        logger_1.default.error('Failed to create test user:', error);
        throw error;
    }
}
/**
 * Delete a test user
 */
async function deleteTestUser(email) {
    try {
        // Ensure database is initialized
        await setupTestDatabase();
        // Delete the user
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        await userRepository.delete({ email });
        logger_1.default.info(`Test user ${email} deleted`);
    }
    catch (error) {
        logger_1.default.error(`Failed to delete test user ${email}:`, error);
        throw error;
    }
}
