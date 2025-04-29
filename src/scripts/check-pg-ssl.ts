// src/scripts/check-pg-ssl.ts
import { Client } from 'pg';
import { config } from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
config();

async function checkPostgresSSL(): Promise<void> {
  // Connect with SSL disabled
  const noSslClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: false,
  });

  // Connect with SSL enabled but no verification
  const sslNoVerifyClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    logger.info('Trying connection without SSL...');
    await noSslClient.connect();
    const result1 = await noSslClient.query('SELECT version()');
    logger.info('✅ Connection without SSL succeeded:', result1.rows[0]);
    await noSslClient.end();
  } catch (error) {
    if (error instanceof Error) {
      logger.error('❌ Connection without SSL failed:', error.message);
    } else {
      logger.error('❌ Connection without SSL failed with an unknown error.');
    }
    try {
      await noSslClient.end();
    } catch {
      /* ignore */
    }
  }

  try {
    logger.info('Trying connection with SSL (rejectUnauthorized: false)...');
    await sslNoVerifyClient.connect();
    const result2 = await sslNoVerifyClient.query('SELECT version()');
    logger.info('✅ Connection with SSL (rejectUnauthorized: false) succeeded:', result2.rows[0]);
    await sslNoVerifyClient.end();
  } catch (error) {
    if (error instanceof Error) {
      logger.error('❌ Connection with SSL (rejectUnauthorized: false) failed:', error.message);
    } else {
      logger.error(
        '❌ Connection with SSL (rejectUnauthorized: false) failed with an unknown error.',
      );
    }
    try {
      await sslNoVerifyClient.end();
    } catch {
      /* ignore */
    }
  }
}

// Run the check
checkPostgresSSL().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
