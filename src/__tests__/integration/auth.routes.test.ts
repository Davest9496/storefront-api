import request from 'supertest';
import app from '../../app';
import AppDataSource from '../../config/database';
import { User, UserRole } from '../../entities/user.entity';
import { hashPassword } from '../../utils/password.utils';
import logger from '../../utils/logger';

describe('Authentication Routes', () => {
  const testUsers: string[] = [];

  // Before all tests, set up the database
  beforeAll(async () => {
    try {
      await AppDataSource.initialize();
      logger.info('Test database initialized');
    } catch (error) {
      console.error('Error initializing test database:', error);
      throw error;
    }
  });

  // After all tests, close the database connection
  afterAll(async () => {
    try {
      // Delete test users if the connection is still active
      if (AppDataSource.isInitialized) {
        const userRepository = AppDataSource.getRepository(User);
        for (const email of testUsers) {
          try {
            await userRepository.delete({ email });
            logger.info(`Test user ${email} deleted`);
          } catch (e) {
            if (e instanceof Error) {
              logger.warn(`Could not delete test user ${email}: ${e.message}`);
            } else {
              logger.warn(`Could not delete test user ${email}: Unknown error`);
            }
          }
        }
      }

      // Close the connection
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('Test database connection closed');
      }
    } catch (error) {
      console.error('Error closing test database connection:', error);
    }
  });

  // Helper function to create a test user
  async function createTestUser(
    email: string,
    password: string,
    userRole: UserRole = UserRole.CUSTOMER,
  ): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      logger.info(`Test user ${email} already exists, returning existing user`);
      return existingUser;
    }

    // Create new user
    const user = new User();
    user.firstName = 'Test';
    user.lastName = 'User';
    user.email = email;
    user.passwordDigest = await hashPassword(password);
    user.role = userRole;

    const savedUser = await userRepository.save(user);
    testUsers.push(email); // Track for cleanup
    logger.info(`Test user ${email} created`);
    return savedUser;
  }

  // Set up test users
  beforeAll(async () => {
    await createTestUser('test@example.com', 'Password123!');
    await createTestUser('existing@example.com', 'Password123!');
  });

  describe('Registration', () => {
    describe('POST /api/auth/signup', () => {
      it('should register a new user', async () => {
        const res = await request(app).post('/api/auth/signup').send({
          firstName: 'New',
          lastName: 'User',
          email: 'new@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        });

        testUsers.push('new@example.com'); // Track for cleanup
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.token).toBeDefined();
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe('new@example.com');
      });

      it('should return 400 if email already exists', async () => {
        const res = await request(app).post('/api/auth/signup').send({
          firstName: 'Existing',
          lastName: 'User',
          email: 'existing@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
      });

      it('should return 400 if password is invalid', async () => {
        const res = await request(app).post('/api/auth/signup').send({
          firstName: 'Invalid',
          lastName: 'Password',
          email: 'invalid@example.com',
          password: 'password', // Missing uppercase, number
          passwordConfirm: 'password',
        });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
      });
    });
  });

  describe('Login', () => {
    describe('POST /api/auth/login', () => {
      // Create a test user for login tests
      beforeAll(async () => {
        await createTestUser('login@example.com', 'Password123!');
      });

      it('should login a user with correct credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: 'login@example.com',
          password: 'Password123!',
        });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.token).toBeDefined();
        expect(res.body.data.user).toBeDefined();
      });

      it('should return 401 with incorrect password', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        });

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
      });

      it('should return 401 with non-existent email', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
      });
    });
  });

  describe('Protected routes', () => {
    let authToken: string;

    // Create a test user and get auth token
    beforeAll(async () => {
      const _user = await createTestUser('protected@example.com', 'Password123!');

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'protected@example.com',
        password: 'Password123!',
      });

      authToken = loginRes.body.token;
    });

    describe('GET /api/auth/me', () => {
      it('should return user data if authenticated', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe('protected@example.com');
      });

      it('should return 401 if not authenticated', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
      });

      it('should return 401 if token is invalid', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('fail');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should successfully logout', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
      });
    });
  });
});
