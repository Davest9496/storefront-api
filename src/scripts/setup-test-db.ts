import { Client } from 'pg';
import { config } from 'dotenv';
import logger from '../utils/logger';

// Load test environment variables
config({ path: '.env.test' });

async function setupTestDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database first
  });

  const testDbName = process.env.DB_DATABASE || 'storefront_test';

  try {
    await client.connect();
    logger.info('Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckResult = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
      testDbName,
    ]);

    // If database exists, drop it
    if ((dbCheckResult.rowCount ?? 0) > 0) {
      logger.info(`Dropping existing test database: ${testDbName}`);
      // Terminate all connections to the database
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${testDbName}'
        AND pid <> pg_backend_pid();
      `);
      await client.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    }

    // Create fresh database
    logger.info(`Creating test database: ${testDbName}`);
    await client.query(`CREATE DATABASE ${testDbName}`);
    logger.info(`Test database created successfully`);
  } catch (error) {
    logger.error('Error setting up test database:', error);
    throw error;
  } finally {
    await client.end();
    logger.info('Database connection closed');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      logger.info('Test database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unhandled error in test database setup:', error);
      process.exit(1);
    });
}

export default setupTestDatabase;
