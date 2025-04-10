import TestDataSource from '../../config/test-database';
import { User } from '../../entities/user.entity';
import { hashPassword } from '../../utils/password.utils';
import jwt from 'jsonwebtoken';

export async function setupTestDatabase() {
  try {
    await TestDataSource.initialize();
    await TestDataSource.synchronize(true); // Clear database
    return TestDataSource;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}

export async function createTestUser(email = 'test@example.com', password = 'TestPassword123!') {
  const userRepository = TestDataSource.getRepository(User);

  const user = new User();
  user.firstName = 'Test';
  user.lastName = 'User';
  user.email = email;
  user.passwordDigest = await hashPassword(password);

  return userRepository.save(user);
}

export function generateTestToken(user: User) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'test_secret', {
    expiresIn: '1h',
  });
}
