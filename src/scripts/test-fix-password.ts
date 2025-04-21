import bcryptjs from 'bcryptjs';
import logger from '../utils/logger';
import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

async function testPasswordVerification(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ecommerce',
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Connect to the database
    logger.info('Connecting to database...');
    await client.connect();
    logger.info('Connected to database');

    // Get the stored hash for John Doe
    const result = await client.query(
      "SELECT password_digest FROM users WHERE email = 'john.doe@example.com'",
    );

    if (result.rows.length === 0) {
      logger.error('User not found');
      return;
    }

    const storedHash = result.rows[0].password_digest;
    logger.info(`Retrieved stored hash: ${storedHash}`);

    // Test with the password that should work
    const testPassword = 'password123';
    const isMatchCorrect = await bcryptjs.compare(testPassword, storedHash);
    logger.info(`Password "password123" matches with bcryptjs: ${isMatchCorrect}`);

    // If no match, create a new hash with bcryptjs and update the database
    if (!isMatchCorrect) {
      const newHash = await bcryptjs.hash('password123', 10);
      logger.info(`Created new hash with bcryptjs: ${newHash}`);

      // Update the password in the database
      await client.query(
        "UPDATE users SET password_digest = $1 WHERE email = 'john.doe@example.com'",
        [newHash],
      );

      logger.info(`Updated password for john.doe@example.com`);

      // Verify the new hash works
      const updatedResult = await client.query(
        "SELECT password_digest FROM users WHERE email = 'john.doe@example.com'",
      );

      const updatedHash = updatedResult.rows[0].password_digest;
      const verifyMatch = await bcryptjs.compare(testPassword, updatedHash);

      logger.info(`Verification with new hash: ${verifyMatch}`);
    }
  } catch (error) {
    logger.error('Error testing password verification:', error);
  } finally {
    await client.end();
    logger.info('Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPasswordVerification()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
