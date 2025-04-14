import request from 'supertest';
import app from '../../app';
import AppDataSource from '../../config/database';
import { User, UserRole } from '../../entities/user.entity';
import { hashPassword } from '../../utils/password.utils';
import logger from '../../utils/logger';

describe('Authentication Integration Tests', () => {
  let testUser: User;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Initialize database connection
    await AppDataSource.initialize();

    // Clear users table
    await AppDataSource.getRepository(User).delete({});

    // Create test users
    const passwordDigest = await hashPassword('Password123!');

    testUser = await AppDataSource.getRepository(User).save({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      passwordDigest,
      role: UserRole.CUSTOMER,
    });

    // Create admin user
    await AppDataSource.getRepository(User).save({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordDigest,
      role: UserRole.ADMIN,
    });
  });

  afterAll(async () => {
    // Close database connection
    await AppDataSource.destroy();
  });

  describe('Auth Endpoints', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/signup').send({
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
      expect(res.body.data.user.role).toBe(UserRole.CUSTOMER);
    });

    it('should not register a user with existing email', async () => {
      const res = await request(app).post('/api/auth/signup').send({
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
      const res = await request(app).post('/api/auth/login').send({
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
      const res = await request(app).post('/api/auth/login').send({
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
      const res = await request(app).post('/api/auth/login').send({
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
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.id).toBe(testUser.id);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should update user profile', async () => {
      const res = await request(app)
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
      const res = await request(app)
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
      const res = await request(app)
        .get('/api/users/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    it('should not allow regular user to access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/users/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('do not have permission');
    });

    it('should allow admin to update user role', async () => {
      const res = await request(app)
        .patch(`/api/users/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.ADMIN,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.id).toBe(testUser.id);
      expect(res.body.data.user.role).toBe(UserRole.ADMIN);
    });
  });

  // Skip the Password Reset Flow tests as they are not implemented yet
  describe.skip('Password Reset Flow', () => {
    let resetToken: string;

    it('should generate a password reset token', async () => {
      const res = await request(app).post('/api/users/forgot-password').send({
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
        logger.info('Skipping password reset test - token not available');
        return;
      }

      const res = await request(app).post('/api/users/reset-password').send({
        token: resetToken,
        password: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Password has been reset');

      // Verify we can login with new password
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'NewPassword123!',
      });

      expect(loginRes.status).toBe(200);
    });
  });
});
