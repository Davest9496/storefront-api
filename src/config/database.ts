import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'storefront',
  entities: [path.join(__dirname, '../entities/**/*.entity.{js,ts}')],
  migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
  synchronize: process.env.NODE_ENV === 'development', // Only true for development
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pooling configuration for AWS RDS
  extra: {
    // Maximum number of connections in the pool
    max: 20,
    // Minimum number of connections in the pool
    min: 2,
    // Maximum time (in milliseconds) that a connection can be idle before being released
    idleTimeoutMillis: 30000,
    // Maximum time (in milliseconds) to wait for a connection from the pool
    connectionTimeoutMillis: 2000,
  },
};

// Create and export the data source
const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
