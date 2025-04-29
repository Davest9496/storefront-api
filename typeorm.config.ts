import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import logger from './src/utils/logger';

// Load environment variables
config();

// Log environment for debugging
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Create configuration with SSL disabled for development
const getConfig = (): DataSourceOptions => {
  // Base configuration
  const baseConfig: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'storefront',
    entities: [join(__dirname, 'src/entities/**/*.entity.{js,ts}')],
    migrations: [join(__dirname, 'src/migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    synchronize: false, // Never true in production
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 10, // Maximum connections in pool
      min: 2, // Minimum connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 30000, // Increased timeout
    },
  };

  // For development, explicitly disable SSL
  if (process.env.NODE_ENV === 'development') {
    logger.info('Development mode: SSL disabled');
    return {
      ...baseConfig,
      ssl: false,
    };
  }

  // For production, try to use SSL with certificate
  try {
    const certPath = path.join(process.cwd(), 'certs/eu-west-2-bundle.pem');
    if (fs.existsSync(certPath)) {
      logger.info(`Production mode: Using SSL certificate from ${certPath}`);
      return {
        ...baseConfig,
        ssl: {
          ca: fs.readFileSync(certPath).toString(),
          rejectUnauthorized: true,
        },
      };
    } else {
      logger.info('Production mode: No certificate found, using rejectUnauthorized: false');
      return {
        ...baseConfig,
        ssl: { rejectUnauthorized: false },
      };
    }
  } catch (error) {
    console.warn(
      `Error with SSL configuration: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.warn('Falling back to rejectUnauthorized: false');
    return {
      ...baseConfig,
      ssl: { rejectUnauthorized: false },
    };
  }
};

// Create and export the data source
const AppDataSource = new DataSource(getConfig());

export default AppDataSource;
