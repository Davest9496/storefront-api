// src/config/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { Payment } from '../entities/payment.entity';
import logger from '../utils/logger';

// Force TypeORM to load entity metadata
import 'reflect-metadata';

// Load appropriate environment variables based on NODE_ENV
config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

// Log database connection parameters (without sensitive data)
logger.info('Database configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  env: process.env.NODE_ENV,
  ssl: 'enabled with rejectUnauthorized: false', // Log SSL configuration
});

// Base connection options shared across all environments
const baseOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'storefront',
  // Explicitly enumerate entities to avoid glob pattern issues
  entities: [User, Product, Order, OrderProduct, Payment],
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
let dataSourceOptions: DataSourceOptions;

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
} else if (process.env.NODE_ENV === 'development') {
  dataSourceOptions = {
    ...baseOptions,
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    logging: ['query', 'error', 'schema'],
  };
} else {
  // Production environment (including staging)
  dataSourceOptions = {
    ...baseOptions,
    // Use connection string if provided (common in AWS deployment)
    url: process.env.DATABASE_URL,
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    logging: ['error'], // Only log errors in production
  };
}

// Create the AppDataSource (this doesn't connect yet, just configures)
export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize database with retry logic (especially important for AWS RDS)
export async function initializeDatabase(retries = 5, delay = 3000): Promise<DataSource> {
  // Log SSL configuration for debugging
  logger.info('SSL Configuration:', {
    sslConfig: JSON.stringify({ rejectUnauthorized: false, sslmode: 'require' }),
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'provided' : 'not provided',
  });

  try {
    if (!AppDataSource.isInitialized) {
      logger.info('Initializing database connection...');
      await AppDataSource.initialize();

      // Run a test query to verify connection is truly working
      const testResult = await AppDataSource.query('SELECT 1 as connection_test');
      logger.info('Database connection verified with test query:', testResult);

      logger.info('Database connection established successfully');
    }
    return AppDataSource;
  } catch (error) {
    logger.error(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
    );

    if (retries > 0) {
      logger.info(`Retrying database connection in ${delay}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return initializeDatabase(retries - 1, delay);
    }

    logger.error('Failed to connect to database after multiple attempts');
    throw error;
  }
}

// For easier testing, we'll provide a specific function to reset the connection
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDatabase should only be called in test environment');
  }

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  await AppDataSource.initialize();
}

export default AppDataSource;
