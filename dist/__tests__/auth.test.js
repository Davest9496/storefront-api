"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const db_helper_1 = require("./helpers/db-helper");
const jwt_utils_1 = require("../utils/jwt.utils");
describe('Authentication API', () => {
    let token;
    // Set up the database before all tests
    beforeAll(async () => {
        // Set NODE_ENV to test
        process.env.NODE_ENV = 'test';
        // Initialize test database
        await (0, db_helper_1.setupTestDatabase)();
        // Create a test user
        const testUser = await (0, db_helper_1.createTestUser)();
        // Generate a token for protected route tests
        token = (0, jwt_utils_1.generateToken)(testUser);
    });
    // Clean up after all tests
    afterAll(async () => {
        // Delete test users
        await (0, db_helper_1.deleteTestUser)('test@example.com');
        await (0, db_helper_1.deleteTestUser)('new@example.com');
        // Close database connection
        await (0, db_helper_1.closeTestDatabase)();
    });
    describe('POST /api/auth/signup', () => {
        it('should create a new user and return token', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/signup').send({
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
                password: 'NewPassword123!',
                passwordConfirm: 'NewPassword123!',
            });
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe('new@example.com');
            expect(res.body.data.user.passwordDigest).toBeUndefined();
        });
        it('should return error if email is already in use', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/signup').send({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com', // This email is already used
                password: 'TestPassword123!',
                passwordConfirm: 'TestPassword123!',
            });
            expect(res.status).toBe(400);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Email already in use');
        });
        it('should return error if password is invalid', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/signup').send({
                firstName: 'New',
                lastName: 'User',
                email: 'another@example.com',
                password: 'weak', // Weak password
                passwordConfirm: 'weak',
            });
            expect(res.status).toBe(400);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Password must be');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should login a user and return token', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'TestPassword123!',
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            // Save token for protected route tests
            token = res.body.token;
        });
        it('should return error for invalid credentials', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'WrongPassword123!',
            });
            expect(res.status).toBe(401);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Incorrect email or password');
        });
    });
    describe('GET /api/auth/me', () => {
        it('should get current user profile', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe('test@example.com');
        });
        it('should return error if not authenticated', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Please log in');
        });
    });
    describe('POST /api/auth/logout', () => {
        it('should logout a user', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toContain('Logged out successfully');
        });
    });
});
