"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
exports.resetDatabase = resetDatabase;
// src/config/data-source.ts
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const user_entity_1 = require("../entities/user.entity");
const product_entity_1 = require("../entities/product.entity");
const order_entity_1 = require("../entities/order.entity");
const order_product_entity_1 = require("../entities/order-product.entity");
const payment_entity_1 = require("../entities/payment.entity");
const logger_1 = __importDefault(require("../utils/logger"));
// Force TypeORM to load entity metadata
require("reflect-metadata");
// Load appropriate environment variables based on NODE_ENV
(0, dotenv_1.config)({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
// Log database connection parameters (without sensitive data)
logger_1.default.info('Database configuration:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    env: process.env.NODE_ENV,
    ssl: 'enabled with rejectUnauthorized: false', // Log SSL configuration
});
// Base connection options shared across all environments
const baseOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'storefront',
    // Explicitly enumerate entities to avoid glob pattern issues
    entities: [user_entity_1.User, product_entity_1.Product, order_entity_1.Order, order_product_entity_1.OrderProduct, payment_entity_1.Payment],
    synchronize: false, // Should be false in production
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    // UPDATED: SSL configuration always enabled with rejectUnauthorized false
    ssl: { rejectUnauthorized: false },
    // AWS RDS specific settings
    extra: {
        // Connection pool settings optimized for AWS RDS t2.micro (free tier)
        max: 10, // Maximum number of connections in the pool
        min: 2, // Minimum number of connections
        // Idle connection settings (important for AWS RDS cost optimization)
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        // Connection acquisition settings
        connectionTimeoutMillis: 5000, // 5 second connection timeout
        // UPDATED: Explicit SSL configuration in extra for pg driver
        ssl: {
            rejectUnauthorized: false,
            sslmode: 'require',
        },
        // Retry logic for AWS RDS transient connection issues
        retry: {
            maxRetryTime: 10000, // Maximum time to retry (10 seconds)
            retryWait: 200, // Base wait time between retries (200ms)
            maxRetries: 5, // Maximum number of retries
        },
        statement_timeout: 30000, // 30 second statement timeout
    },
};
// Configure data source based on environment
let dataSourceOptions;
if (process.env.NODE_ENV === 'test') {
    dataSourceOptions = {
        ...baseOptions,
        database: process.env.DB_DATABASE || 'storefront_test',
        synchronize: true,
        dropSchema: true,
        logging: false,
        // Keep SSL enabled for test environment too for consistency
        ssl: { rejectUnauthorized: false },
    };
}
else if (process.env.NODE_ENV === 'development') {
    dataSourceOptions = {
        ...baseOptions,
        migrations: [path_1.default.join(__dirname, '../migrations/**/*.{js,ts}')],
        migrationsTableName: 'migrations',
        logging: ['query', 'error', 'schema'],
    };
}
else {
    // Production environment (including staging)
    dataSourceOptions = {
        ...baseOptions,
        // Use connection string if provided (common in AWS deployment)
        url: process.env.DATABASE_URL,
        migrations: [path_1.default.join(__dirname, '../migrations/**/*.{js,ts}')],
        migrationsTableName: 'migrations',
        logging: ['error'], // Only log errors in production
    };
}
// Create the AppDataSource (this doesn't connect yet, just configures)
exports.AppDataSource = new typeorm_1.DataSource(dataSourceOptions);
// Initialize database with retry logic (especially important for AWS RDS)
async function initializeDatabase(retries = 5, delay = 3000) {
    // Log SSL configuration for debugging
    logger_1.default.info('SSL Configuration:', {
        sslConfig: JSON.stringify({ rejectUnauthorized: false, sslmode: 'require' }),
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'provided' : 'not provided',
    });
    try {
        if (!exports.AppDataSource.isInitialized) {
            logger_1.default.info('Initializing database connection...');
            await exports.AppDataSource.initialize();
            // Run a test query to verify connection is truly working
            const testResult = await exports.AppDataSource.query('SELECT 1 as connection_test');
            logger_1.default.info('Database connection verified with test query:', testResult);
            logger_1.default.info('Database connection established successfully');
        }
        return exports.AppDataSource;
    }
    catch (error) {
        logger_1.default.error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
        if (retries > 0) {
            logger_1.default.info(`Retrying database connection in ${delay}ms... (${retries} attempts left)`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return initializeDatabase(retries - 1, delay);
        }
        logger_1.default.error('Failed to connect to database after multiple attempts');
        throw error;
    }
}
// For easier testing, we'll provide a specific function to reset the connection
async function resetDatabase() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('resetDatabase should only be called in test environment');
    }
    if (exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.destroy();
    }
    await exports.AppDataSource.initialize();
}
exports.default = exports.AppDataSource;
