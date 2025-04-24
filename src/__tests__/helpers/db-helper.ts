// // src/__tests__/helpers/db-helper.ts
// import { AppDataSource, resetDatabase } from '../../config/data-source';
// import { User } from '../../entities/user.entity';
// import { hashPassword } from '../../utils/password.utils';
// import logger from '../../utils/logger';

// /**
//  * Ensure database is initialized for tests
//  */
// export async function setupTestDatabase(): Promise<void> {
//   try {
//     if (!AppDataSource.isInitialized) {
//       process.env.NODE_ENV = 'test'; // Ensure we're in test mode
//       await AppDataSource.initialize();
//       logger.info('Test database initialized');
//     }
//   } catch (error) {
//     logger.error('Failed to initialize test database:', error);
//     throw error;
//   }
// }

// /**
//  * Reset the database to a clean state
//  */
// export async function resetTestDatabase(): Promise<void> {
//   try {
//     await resetDatabase();
//     logger.info('Test database reset to clean state');
//   } catch (error) {
//     logger.error('Failed to reset test database:', error);
//     throw error;
//   }
// }

// /**
//  * Close the database connection
//  */
// export async function closeTestDatabase(): Promise<void> {
//   try {
//     if (AppDataSource.isInitialized) {
//       await AppDataSource.destroy();
//       logger.info('Test database connection closed');
//     }
//   } catch (error) {
//     logger.error('Failed to close test database:', error);
//     throw error;
//   }
// }

// /**
//  * Create a test user
//  */
// export async function createTestUser(
//   firstName = 'Test',
//   lastName = 'User',
//   email = 'test@example.com',
//   password = 'TestPassword123!',
// ): Promise<User> {
//   try {
//     // Ensure database is initialized
//     await setupTestDatabase();

//     // Check if user already exists
//     const userRepository = AppDataSource.getRepository(User);
//     let user = await userRepository.findOne({ where: { email } });

//     if (user) {
//       logger.info(`Test user ${email} already exists`);
//       return user;
//     }

//     // Create new user
//     user = new User();
//     user.firstName = firstName;
//     user.lastName = lastName;
//     user.email = email;
//     user.passwordDigest = await hashPassword(password);

//     await userRepository.save(user);
//     logger.info(`Test user ${email} created`);

//     return user;
//   } catch (error) {
//     logger.error('Failed to create test user:', error);
//     throw error;
//   }
// }

// /**
//  * Delete a test user
//  */
// export async function deleteTestUser(email: string): Promise<void> {
//   try {
//     // Ensure database is initialized
//     await setupTestDatabase();

//     // Delete the user
//     const userRepository = AppDataSource.getRepository(User);
//     await userRepository.delete({ email });
//     logger.info(`Test user ${email} deleted`);
//   } catch (error) {
//     logger.error(`Failed to delete test user ${email}:`, error);
//     throw error;
//   }
// }
