import { config } from 'dotenv';
import { Client } from 'pg';
import logger from '../utils/logger';

// Load environment variables
config();

async function testRDSConnection(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false }, // Enable SSL with certificate verification disabled
    connectionTimeoutMillis: 5000, // 5 second connection timeout
  });

  try {
    logger.info('Connecting to AWS RDS database...');
    logger.info(
      `Host: ${process.env.DB_HOST}, Port: ${process.env.DB_PORT}, Database: ${process.env.DB_DATABASE}`,
    );
    logger.info('Using SSL: enabled (rejectUnauthorized: false)');

    await client.connect();
    logger.info('✅ Successfully connected to AWS RDS');

    // Test a simple query
    const queryResult = await client.query(
      'SELECT current_timestamp as time, current_database() as database',
    );
    logger.info('Query result:', queryResult.rows[0]);

    // Get database information
    const versionQuery = await client.query('SELECT version()');
    logger.info('PostgreSQL version:', versionQuery.rows[0].version);

    // Test tables query
    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesQuery.rows.length > 0) {
      logger.info(`Found ${tablesQuery.rows.length} tables in database:`);
      tablesQuery.rows.forEach((row, index) => {
        logger.info(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      logger.warn('No tables found in database. You may need to run migrations.');
    }

    // Check connection pool settings
    const poolSettingsQuery = await client.query(`
      SELECT name, setting
      FROM pg_settings
      WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size')
    `);

    logger.info('RDS PostgreSQL settings:');
    poolSettingsQuery.rows.forEach((row) => {
      logger.info(`  ${row.name}: ${row.setting}`);
    });
  } catch (error) {
    logger.error(
      '❌ RDS connection test failed:',
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error) {
      logger.error('Error details:', error.message);

      // Common AWS RDS connection issues
      if (error.message.includes('timeout')) {
        logger.error('Connection timeout - check your security groups and network ACLs');
      } else if (error.message.includes('password authentication failed')) {
        logger.error('Authentication failed - check your DB_USERNAME and DB_PASSWORD');
      } else if (error.message.includes('does not exist')) {
        logger.error('Database does not exist - check your DB_DATABASE name');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('EHOSTUNREACH')) {
        logger.error('Host not found - check your DB_HOST value and network connectivity');
      }
    }
  } finally {
    // Close the connection
    await client.end();
    logger.info('Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRDSConnection()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default testRDSConnection;
