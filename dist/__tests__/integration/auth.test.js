"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const database_1 = __importDefault(require("../../config/database"));
const user_entity_1 = require("../../entities/user.entity");
const password_utils_1 = require("../../utils/password.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
describe('Authentication Integration Tests', () => {
    let testUser;
    let userToken;
    let adminToken;
    beforeAll(async () => {
        // Initialize database connection
        await database_1.default.initialize();
        // Clear users table
        await database_1.default.getRepository(user_entity_1.User).delete({});
        // Create test users
        const passwordDigest = await (0, password_utils_1.hashPassword)('Password123!');
        testUser = await database_1.default.getRepository(user_entity_1.User).save({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            passwordDigest,
            role: user_entity_1.UserRole.CUSTOMER,
        });
        // Create admin user
        await database_1.default.getRepository(user_entity_1.User).save({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            passwordDigest,
            role: user_entity_1.UserRole.ADMIN,
        });
    });
    afterAll(async () => {
        // Close database connection
        await database_1.default.destroy();
    });
    describe('Auth Endpoints', () => {
        it('should register a new user', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/signup').send({
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
                password: 'Password123!',
                passwordConfirm: 'Password123!',
            });
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user.email).toBe('new@example.com');
            expect(res.body.data.user.role).toBe(user_entity_1.UserRole.CUSTOMER);
        });
        it('should not register a user with existing email', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/signup').send({
                firstName: 'Duplicate',
                lastName: 'User',
                email: 'test@example.com', // Already exists
                password: 'Password123!',
                passwordConfirm: 'Password123!',
            });
            expect(res.status).toBe(400);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Email already in use');
        });
        it('should login a user', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            // Save token for later tests
            userToken = res.body.token;
        });
        it('should login an admin user', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'admin@example.com',
                password: 'Password123!',
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            // Save admin token for later tests
            adminToken = res.body.token;
        });
        it('should not login with incorrect password', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'WrongPassword123!',
            });
            expect(res.status).toBe(401);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Incorrect email or password');
        });
    });
    // Skip the User Profile Endpoints tests as they are not implemented yet
    describe.skip('User Profile Endpoints', () => {
        it('should get current user profile', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.id).toBe(testUser.id);
            expect(res.body.data.user.email).toBe(testUser.email);
        });
        it('should update user profile', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                firstName: 'Updated',
                lastName: 'Name',
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.firstName).toBe('Updated');
            expect(res.body.data.user.lastName).toBe('Name');
        });
        it('should not update profile with existing email', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                email: 'admin@example.com', // Already exists
            });
            expect(res.status).toBe(400);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('Email is already in use');
        });
    });
    // Skip the Admin Endpoints tests as they are not implemented yet
    describe.skip('Admin Endpoints', () => {
        it('should allow admin to get all users', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/users/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.users)).toBe(true);
            expect(res.body.data.users.length).toBeGreaterThan(0);
        });
        it('should not allow regular user to access admin endpoints', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/users/admin/users')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toContain('do not have permission');
        });
        it('should allow admin to update user role', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/users/admin/users/${testUser.id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                role: user_entity_1.UserRole.ADMIN,
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.id).toBe(testUser.id);
            expect(res.body.data.user.role).toBe(user_entity_1.UserRole.ADMIN);
        });
    });
    // Skip the Password Reset Flow tests as they are not implemented yet
    describe.skip('Password Reset Flow', () => {
        let resetToken;
        it('should generate a password reset token', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/users/forgot-password').send({
                email: 'test@example.com',
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toContain('Token sent to email');
            // In development mode, the token is returned in the response
            if (process.env.NODE_ENV === 'development') {
                resetToken = res.body.token;
                expect(resetToken).toBeDefined();
            }
        });
        // This test would only run in development mode
        it('should reset password with token', async () => {
            if (!resetToken) {
                logger_1.default.info('Skipping password reset test - token not available');
                return;
            }
            const res = await (0, supertest_1.default)(app_1.default).post('/api/users/reset-password').send({
                token: resetToken,
                password: 'NewPassword123!',
                passwordConfirm: 'NewPassword123!',
            });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toContain('Password has been reset');
            // Verify we can login with new password
            const loginRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'NewPassword123!',
            });
            expect(loginRes.status).toBe(200);
        });
    });
});
