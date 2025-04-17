"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestDatabase = setupTestDatabase;
exports.teardownTestDatabase = teardownTestDatabase;
exports.createTestUser = createTestUser;
exports.generateTestToken = generateTestToken;
const test_database_1 = __importDefault(require("../../config/test-database"));
const user_entity_1 = require("../../entities/user.entity");
const password_utils_1 = require("../../utils/password.utils");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function setupTestDatabase() {
    try {
        await test_database_1.default.initialize();
        await test_database_1.default.synchronize(true); // Clear database
        return test_database_1.default;
    }
    catch (error) {
        console.error('Error setting up test database:', error);
        throw error;
    }
}
async function teardownTestDatabase() {
    if (test_database_1.default.isInitialized) {
        await test_database_1.default.destroy();
    }
}
async function createTestUser(email = 'test@example.com', password = 'TestPassword123!') {
    const userRepository = test_database_1.default.getRepository(user_entity_1.User);
    const user = new user_entity_1.User();
    user.firstName = 'Test';
    user.lastName = 'User';
    user.email = email;
    user.passwordDigest = await (0, password_utils_1.hashPassword)(password);
    return userRepository.save(user);
}
function generateTestToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'test_secret', {
        expiresIn: '1h',
    });
}
