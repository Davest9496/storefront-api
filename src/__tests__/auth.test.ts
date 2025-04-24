// import request from 'supertest';
// import app from '../app';
// import {
//   setupTestDatabase,
//   closeTestDatabase,
//   createTestUser,
//   deleteTestUser,
// } from './helpers/db-helper';
// import { generateToken } from '../utils/jwt.utils';

// describe('Authentication API', () => {
//   let token: string;

//   // Set up the database before all tests
//   beforeAll(async () => {
//     // Set NODE_ENV to test
//     process.env.NODE_ENV = 'test';

//     // Initialize test database
//     await setupTestDatabase();

//     // Create a test user
//     const testUser = await createTestUser();

//     // Generate a token for protected route tests
//     token = generateToken(testUser);
//   });

//   // Clean up after all tests
//   afterAll(async () => {
//     // Delete test users
//     await deleteTestUser('test@example.com');
//     await deleteTestUser('new@example.com');

//     // Close database connection
//     await closeTestDatabase();
//   });

//   describe('POST /api/auth/signup', () => {
//     it('should create a new user and return token', async () => {
//       const res = await request(app).post('/api/auth/signup').send({
//         firstName: 'New',
//         lastName: 'User',
//         email: 'new@example.com',
//         password: 'NewPassword123!',
//         passwordConfirm: 'NewPassword123!',
//       });

//       expect(res.status).toBe(201);
//       expect(res.body.status).toBe('success');
//       expect(res.body.token).toBeDefined();
//       expect(res.body.data.user).toBeDefined();
//       expect(res.body.data.user.email).toBe('new@example.com');
//       expect(res.body.data.user.passwordDigest).toBeUndefined();
//     });

//     it('should return error if email is already in use', async () => {
//       const res = await request(app).post('/api/auth/signup').send({
//         firstName: 'Test',
//         lastName: 'User',
//         email: 'test@example.com', // This email is already used
//         password: 'TestPassword123!',
//         passwordConfirm: 'TestPassword123!',
//       });

//       expect(res.status).toBe(400);
//       expect(res.body.status).toBe('fail');
//       expect(res.body.message).toContain('Email already in use');
//     });

//     it('should return error if password is invalid', async () => {
//       const res = await request(app).post('/api/auth/signup').send({
//         firstName: 'New',
//         lastName: 'User',
//         email: 'another@example.com',
//         password: 'weak', // Weak password
//         passwordConfirm: 'weak',
//       });

//       expect(res.status).toBe(400);
//       expect(res.body.status).toBe('fail');
//       expect(res.body.message).toContain('Password must be');
//     });
//   });

//   describe('POST /api/auth/login', () => {
//     it('should login a user and return token', async () => {
//       const res = await request(app).post('/api/auth/login').send({
//         email: 'test@example.com',
//         password: 'TestPassword123!',
//       });

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe('success');
//       expect(res.body.token).toBeDefined();

//       // Save token for protected route tests
//       token = res.body.token;
//     });

//     it('should return error for invalid credentials', async () => {
//       const res = await request(app).post('/api/auth/login').send({
//         email: 'test@example.com',
//         password: 'WrongPassword123!',
//       });

//       expect(res.status).toBe(401);
//       expect(res.body.status).toBe('fail');
//       expect(res.body.message).toContain('Incorrect email or password');
//     });
//   });

//   describe('GET /api/auth/me', () => {
//     it('should get current user profile', async () => {
//       const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe('success');
//       expect(res.body.data.user).toBeDefined();
//       expect(res.body.data.user.email).toBe('test@example.com');
//     });

//     it('should return error if not authenticated', async () => {
//       const res = await request(app).get('/api/auth/me');

//       expect(res.status).toBe(401);
//       expect(res.body.status).toBe('fail');
//       expect(res.body.message).toContain('Please log in');
//     });
//   });

//   describe('POST /api/auth/logout', () => {
//     it('should logout a user', async () => {
//       const res = await request(app)
//         .post('/api/auth/logout')
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe('success');
//       expect(res.body.message).toContain('Logged out successfully');
//     });
//   });
// });
