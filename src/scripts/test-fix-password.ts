import bcryptjs from 'bcryptjs';
import { Client } from 'pg';
import { config } from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
config();

async function updateAlexPassword(): Promise<void> {
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

    // Create a new password hash
    const plainPassword = 'password123';
    const hashedPassword = await bcryptjs.hash(plainPassword, 10);

    logger.info(`Generated new hash for "${plainPassword}": ${hashedPassword}`);

    // Update Alex's password
    await client.query(
      "UPDATE users SET password_digest = $1 WHERE email = 'alex.smith@example.com'",
      [hashedPassword],
    );

    logger.info(`Password updated for alex.smith@example.com`);
  } catch (error) {
    logger.error('Error updating password:', error);
  } finally {
    await client.end();
    logger.info('Database connection closed');
  }
}

// Run the script
updateAlexPassword()
  .then(() => {
    logger.info('Password update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
