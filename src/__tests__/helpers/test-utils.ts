import TestDataSource from '../../config/test-database';
import { User } from '../../entities/user.entity';
import { hashPassword } from '../../utils/password.utils';
import { generateToken } from '../../utils/jwt.utils';
import logger from '../../utils/logger';

/**
 * Initialize the test database connection
 */
export async function initializeTestDatabase(): Promise<void> {
  try {
    // TestDataSource.isInitialized is a property, not a function
    if (!TestDataSource.isInitialized) {
      logger.info('Initializing test database connection');
      await TestDataSource.initialize();
      logger.info('Test database connection initialized');
    }
  } catch (error) {
    logger.error('Error initializing test database:', error);
    throw error;
  }
}

/**
 * Close the test database connection
 */
export async function closeTestDatabase(): Promise<void> {
  try {
    if (TestDataSource.isInitialized) {
      logger.info('Closing test database connection');
      await TestDataSource.destroy();
      logger.info('Test database connection closed');
    }
  } catch (error) {
    logger.error('Error closing test database:', error);
    throw error;
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  firstName = 'Test',
  lastName = 'User',
  email = 'test@example.com',
  password = 'TestPassword123!',
): Promise<User> {
  try {
    // Make sure database is initialized
    if (!TestDataSource.isInitialized) {
      await initializeTestDatabase();
    }

    // Check if test user already exists
    const userRepository = TestDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { email } });

    if (user) {
      logger.info(`Test user ${email} already exists, returning existing user`);
      return user;
    }

    // Create new test user
    logger.info(`Creating test user ${email}`);
    user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.passwordDigest = await hashPassword(password);

    return await userRepository.save(user);
  } catch (error) {
    logger.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Generate an authentication token for a test user
 */
export function generateTestToken(user: User): string {
  return generateToken(user);
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // Make sure database is initialized
    if (!TestDataSource.isInitialized) {
      await initializeTestDatabase();
    }

    // Clean up in reverse order of foreign key dependencies
    logger.info('Cleaning up test data');

    // Use direct query execution for more reliable cleanup
    await TestDataSource.query('DELETE FROM payments');
    await TestDataSource.query('DELETE FROM order_products');
    await TestDataSource.query('DELETE FROM orders');
    await TestDataSource.query('DELETE FROM users');
    await TestDataSource.query('DELETE FROM products');

    logger.info('Test data cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up test data:', error);
    throw error;
  }
}
