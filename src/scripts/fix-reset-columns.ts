import { Client, ClientConfig } from 'pg';
import { config } from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
config();

async function fixResetColumns(): Promise<void> {
  // Configure with SSL
  const clientConfig: ClientConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false }, // Keep SSL but don't verify certificate
  };

  logger.info('Database configuration:', {
    host: clientConfig.host,
    port: clientConfig.port,
    database: clientConfig.database,
    user: clientConfig.user,
    ssl: Boolean(clientConfig.ssl),
  });

  const client = new Client(clientConfig);

  try {
    // Connect to the database
    logger.info('Connecting to database with SSL...');
    await client.connect();
    logger.info('Connected to database successfully');

    // Start transaction
    await client.query('BEGIN');

    // 1. Check if user_role enum type exists
    logger.info('Checking if user_role enum type exists...');
    const enumTypeExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'user_role'
      );
    `);

    // Create enum type if it doesn't exist
    if (!enumTypeExists.rows[0].exists) {
      logger.info('Creating user_role enum type...');
      await client.query(`CREATE TYPE user_role AS ENUM ('customer', 'admin')`);
      logger.info('user_role enum type created successfully');
    } else {
      logger.info('user_role enum type already exists');
    }

    // 2. Check if role column exists
    logger.info('Checking if role column exists...');
    const roleColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      );
    `);

    // Add role column if it doesn't exist
    if (!roleColumnExists.rows[0].exists) {
      logger.info('Adding role column to users table...');
      await client.query(`ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'customer'`);
      logger.info('role column added successfully');
    } else {
      logger.info('role column already exists');
    }

    // 3. Check if reset_password_token column exists
    logger.info('Checking if reset_password_token column exists...');
    const resetTokenColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'reset_password_token'
      );
    `);

    // Add reset_password_token column if it doesn't exist
    if (!resetTokenColumnExists.rows[0].exists) {
      logger.info('Adding reset_password_token column...');
      await client.query(`ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255)`);
      logger.info('reset_password_token column added successfully');
    } else {
      logger.info('reset_password_token column already exists');
    }

    // 4. Check if reset_password_expires column exists
    logger.info('Checking if reset_password_expires column exists...');
    const resetExpiresColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'reset_password_expires'
      );
    `);

    // Add reset_password_expires column if it doesn't exist
    if (!resetExpiresColumnExists.rows[0].exists) {
      logger.info('Adding reset_password_expires column...');
      await client.query(`ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMP`);
      logger.info('reset_password_expires column added successfully');
    } else {
      logger.info('reset_password_expires column already exists');
    }

    // Update admin users
    logger.info('Setting admin role for first user...');
    await client.query(`UPDATE users SET role = 'admin' WHERE id = 1`);

    // Commit transaction
    await client.query('COMMIT');
    logger.info('✅ Database schema updates completed successfully');
  } catch (error) {
    // Rollback on error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error('Error during rollback:', rollbackError);
    }

    logger.error('❌ Error updating database schema:', error);
    throw error;
  } finally {
    // Close connection
    try {
      await client.end();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
}

// Run the fix script if this file is executed directly
if (require.main === module) {
  fixResetColumns()
    .then(() => {
      logger.info('Database schema fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default fixResetColumns;
