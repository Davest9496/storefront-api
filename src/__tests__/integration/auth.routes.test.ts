import request from 'supertest';
import { initializeTestApp, closeTestApp, TestDataSource } from '../setup-test-app';
import { User } from '../../entities/user.entity';
import { hashPassword } from '../../utils/password.utils';
import { generateToken } from '../../utils/jwt.utils';
import logger from '../../utils/logger';
import { Express } from 'express';

/**
 * Helper function to create a test user in the database
 */
async function createTestUser(
  firstName = 'Test',
  lastName = 'User',
  email = 'test@example.com',
  password = 'TestPassword123!',
): Promise<User> {
  try {
    // Get repository from test data source
    const userRepository = TestDataSource.getRepository(User);

    // Check if user already exists
    let user = await userRepository.findOne({ where: { email } });

    if (user) {
      logger.info(`Test user ${email} already exists, returning existing user`);
      return user;
    }

    // Create new user
    user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.passwordDigest = await hashPassword(password);

    await userRepository.save(user);
    logger.info(`Test user ${email} created`);

    return user;
  } catch (error) {
    logger.error(`Failed to create test user ${email}:`, error);
    throw error;
  }
}

describe('Authentication Routes', () => {
  let app: Express;
  let testUser: User;
  let authToken: string;
  // Variable to store temporary test users in beforeEach blocks
  let _testUser: User;

  beforeAll(async () => {
    // Initialize the test app with our mocked database
    app = await initializeTestApp();

    // Create a test user directly using our test data source
    const userRepository = TestDataSource.getRepository(User);

    testUser = new User();
    testUser.firstName = 'Test';
    testUser.lastName = 'User';
    testUser.email = 'test@example.com';
    testUser.passwordDigest = await hashPassword('TestPassword123!');

    await userRepository.save(testUser);
    logger.info('Test user created for integration tests');

    // Generate a valid auth token
    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    const userRepository = TestDataSource.getRepository(User);
    await userRepository.delete({ email: testUser.email });
    await userRepository.delete({ email: 'new@example.com' });
    await userRepository.delete({ email: 'existing@example.com' });
    await userRepository.delete({ email: 'login@example.com' });
    await userRepository.delete({ email: 'protected@example.com' });

    // Close the test app and database
    await closeTestApp();
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'TestPassword123!',
        passwordConfirm: 'TestPassword123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newuser@example.com');
      expect(res.body.data.user.passwordDigest).toBeUndefined();
    });

    it('should return error if email already exists', async () => {
      // First create a test user
      await createTestUser('Test', 'User', 'existing@example.com', 'TestPassword123!');

      // Try to create another user with the same email
      const res = await request(app).post('/api/auth/signup').send({
        firstName: 'Another',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'TestPassword123!',
        passwordConfirm: 'TestPassword123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Email already in use');
    });

    it('should return error if password is too weak', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        firstName: 'New',
        lastName: 'User',
        email: 'another@example.com',
        password: 'weak',
        passwordConfirm: 'weak',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      _testUser = await createTestUser('Login', 'User', 'login@example.com', 'TestPassword123!');
    });

    it('should login a user with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'TestPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');

      // Save token for protected route tests
      authToken = res.body.token;
    });

    it('should return error for invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Incorrect email or password');
    });

    it('should return error for non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Incorrect email or password');
    });
  });

  describe('Protected routes', () => {
    beforeAll(async () => {
      // Create test user and get auth token for protected route tests
      _testUser = await createTestUser(
        'Protected',
        'User',
        'protected@example.com',
        'TestPassword123!',
      );

      const res = await request(app).post('/api/auth/login').send({
        email: 'protected@example.com',
        password: 'TestPassword123!',
      });

      authToken = res.body.token;
    });

    describe('GET /api/auth/me', () => {
      it('should get current user profile when authenticated', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe('protected@example.com');
      });

      it('should return error if not authenticated', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toContain('Please log in');
      });

      it('should return error if token is invalid', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout a user successfully', async () => {
        const res = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.message).toContain('Logged out successfully');
      });

      it('should return error if not authenticated', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
      });
    });
  });
});
