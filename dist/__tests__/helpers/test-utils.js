"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTestDatabase = initializeTestDatabase;
exports.closeTestDatabase = closeTestDatabase;
exports.createTestUser = createTestUser;
exports.generateTestToken = generateTestToken;
exports.cleanupTestData = cleanupTestData;
const test_database_1 = __importDefault(require("../../config/test-database"));
const user_entity_1 = require("../../entities/user.entity");
const password_utils_1 = require("../../utils/password.utils");
const jwt_utils_1 = require("../../utils/jwt.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Initialize the test database connection
 */
async function initializeTestDatabase() {
    try {
        // TestDataSource.isInitialized is a property, not a function
        if (!test_database_1.default.isInitialized) {
            logger_1.default.info('Initializing test database connection');
            await test_database_1.default.initialize();
            logger_1.default.info('Test database connection initialized');
        }
    }
    catch (error) {
        logger_1.default.error('Error initializing test database:', error);
        throw error;
    }
}
/**
 * Close the test database connection
 */
async function closeTestDatabase() {
    try {
        if (test_database_1.default.isInitialized) {
            logger_1.default.info('Closing test database connection');
            await test_database_1.default.destroy();
            logger_1.default.info('Test database connection closed');
        }
    }
    catch (error) {
        logger_1.default.error('Error closing test database:', error);
        throw error;
    }
}
/**
 * Create a test user in the database
 */
async function createTestUser(firstName = 'Test', lastName = 'User', email = 'test@example.com', password = 'TestPassword123!') {
    try {
        // Make sure database is initialized
        if (!test_database_1.default.isInitialized) {
            await initializeTestDatabase();
        }
        // Check if test user already exists
        const userRepository = test_database_1.default.getRepository(user_entity_1.User);
        let user = await userRepository.findOne({ where: { email } });
        if (user) {
            logger_1.default.info(`Test user ${email} already exists, returning existing user`);
            return user;
        }
        // Create new test user
        logger_1.default.info(`Creating test user ${email}`);
        user = new user_entity_1.User();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.passwordDigest = await (0, password_utils_1.hashPassword)(password);
        return await userRepository.save(user);
    }
    catch (error) {
        logger_1.default.error('Error creating test user:', error);
        throw error;
    }
}
/**
 * Generate an authentication token for a test user
 */
function generateTestToken(user) {
    return (0, jwt_utils_1.generateToken)(user);
}
/**
 * Clean up test data from the database
 */
async function cleanupTestData() {
    try {
        // Make sure database is initialized
        if (!test_database_1.default.isInitialized) {
            await initializeTestDatabase();
        }
        // Clean up in reverse order of foreign key dependencies
        logger_1.default.info('Cleaning up test data');
        // Use direct query execution for more reliable cleanup
        await test_database_1.default.query('DELETE FROM payments');
        await test_database_1.default.query('DELETE FROM order_products');
        await test_database_1.default.query('DELETE FROM orders');
        await test_database_1.default.query('DELETE FROM users');
        await test_database_1.default.query('DELETE FROM products');
        logger_1.default.info('Test data cleanup completed');
    }
    catch (error) {
        logger_1.default.error('Error cleaning up test data:', error);
        throw error;
    }
}
