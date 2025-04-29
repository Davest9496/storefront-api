import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
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

// Configure SSL based on environment
const getSslConfig = () => {
  // In development environment, disable SSL by default
  if (process.env.NODE_ENV === 'development') {
    // Unless explicitly enabled with DB_USE_SSL
    if (process.env.DB_USE_SSL === 'true') {
      logger.info('Development mode with SSL enabled');
      // Continue to SSL config
    } else {
      logger.info('Development mode: Disabling SSL for local development');
      return false;
    }
  }

  // Production, test with SSL enabled, or development with DB_USE_SSL=true
  try {
    // Try multiple certificate paths
    const possiblePaths = [
      path.join(process.cwd(), 'certs/eu-west-2-bundle.pem'), // Lambda path
      path.join(__dirname, '../../certs/eu-west-2-bundle.pem'), // Local dev path
    ];

    // Find the first path that exists
    for (const certPath of possiblePaths) {
      if (fs.existsSync(certPath)) {
        logger.info(`SSL: Using RDS CA certificate from: ${certPath}`);
        return {
          ca: fs.readFileSync(certPath).toString(),
          rejectUnauthorized: true,
        };
      }
    }

    // Fall back to rejectUnauthorized: false if no cert found
    logger.warn('SSL: No certificate found, using rejectUnauthorized: false');
    return { rejectUnauthorized: false };
  } catch (error) {
    logger.warn(
      `SSL: Error loading certificate: ${error instanceof Error ? error.message : String(error)}`,
    );
    logger.warn('SSL: Falling back to rejectUnauthorized: false');
    return { rejectUnauthorized: false };
  }
};

// Get SSL configuration
const sslConfig = getSslConfig();

// Log database connection parameters (without sensitive data)
logger.info('Database configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME ? '✓' : '✗',
  env: process.env.NODE_ENV,
  ssl: sslConfig
    ? typeof sslConfig === 'boolean'
      ? 'disabled'
      : sslConfig.ca
        ? 'enabled with CA certificate'
        : 'enabled with rejectUnauthorized: false'
    : 'disabled',
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
  // SSL configuration from our function
  ssl: sslConfig,
  // AWS RDS specific settings
  extra: {
    // Connection pool settings optimized for AWS RDS t2.micro (free tier)
    max: 10, // Maximum number of connections in the pool
    min: 2, // Minimum number of connections
    // Idle connection settings (important for AWS RDS cost optimization)
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    // Connection acquisition settings
    connectionTimeoutMillis: 5000, // 5 second connection timeout
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
    // Explicitly override SSL for test environment
    ssl: false,
  };
} else if (process.env.NODE_ENV === 'development') {
  dataSourceOptions = {
    ...baseOptions,
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    logging: ['query', 'error', 'schema'],
    // Only use SSL in development if explicitly requested
    ssl: false,
  };
} else {
  // Production environment (including staging)
  dataSourceOptions = {
    ...baseOptions,
    // If DATABASE_URL is provided, use it but WITHOUT its SSL settings
    ...(process.env.DATABASE_URL
      ? {
          url: process.env.DATABASE_URL.split('?')[0], // Remove any query params with SSL config
        }
      : {}),
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    logging: ['error'], // Only log errors in production
  };
}

// Create the AppDataSource (this doesn't connect yet, just configures)
export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize database with retry logic (especially important for AWS RDS)
export async function initializeDatabase(retries = 5, delay = 3000): Promise<DataSource> {
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
