"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const pg_1 = require("pg");
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
(0, dotenv_1.config)();
async function testRDSConnection() {
    const client = new pg_1.Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false }, // Enable SSL with certificate verification disabled
        connectionTimeoutMillis: 5000, // 5 second connection timeout
    });
    try {
        logger_1.default.info('Connecting to AWS RDS database...');
        logger_1.default.info(`Host: ${process.env.DB_HOST}, Port: ${process.env.DB_PORT}, Database: ${process.env.DB_DATABASE}`);
        logger_1.default.info('Using SSL: enabled (rejectUnauthorized: false)');
        await client.connect();
        logger_1.default.info('✅ Successfully connected to AWS RDS');
        // Test a simple query
        const queryResult = await client.query('SELECT current_timestamp as time, current_database() as database');
        logger_1.default.info('Query result:', queryResult.rows[0]);
        // Get database information
        const versionQuery = await client.query('SELECT version()');
        logger_1.default.info('PostgreSQL version:', versionQuery.rows[0].version);
        // Test tables query
        const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        if (tablesQuery.rows.length > 0) {
            logger_1.default.info(`Found ${tablesQuery.rows.length} tables in database:`);
            tablesQuery.rows.forEach((row, index) => {
                logger_1.default.info(`  ${index + 1}. ${row.table_name}`);
            });
        }
        else {
            logger_1.default.warn('No tables found in database. You may need to run migrations.');
        }
        // Check connection pool settings
        const poolSettingsQuery = await client.query(`
      SELECT name, setting
      FROM pg_settings
      WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size')
    `);
        logger_1.default.info('RDS PostgreSQL settings:');
        poolSettingsQuery.rows.forEach((row) => {
            logger_1.default.info(`  ${row.name}: ${row.setting}`);
        });
    }
    catch (error) {
        logger_1.default.error('❌ RDS connection test failed:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error) {
            logger_1.default.error('Error details:', error.message);
            // Common AWS RDS connection issues
            if (error.message.includes('timeout')) {
                logger_1.default.error('Connection timeout - check your security groups and network ACLs');
            }
            else if (error.message.includes('password authentication failed')) {
                logger_1.default.error('Authentication failed - check your DB_USERNAME and DB_PASSWORD');
            }
            else if (error.message.includes('does not exist')) {
                logger_1.default.error('Database does not exist - check your DB_DATABASE name');
            }
            else if (error.message.includes('ENOTFOUND') || error.message.includes('EHOSTUNREACH')) {
                logger_1.default.error('Host not found - check your DB_HOST value and network connectivity');
            }
        }
    }
    finally {
        // Close the connection
        await client.end();
        logger_1.default.info('Database connection closed');
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
exports.default = testRDSConnection;
