import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { Payment } from '../entities/payment.entity';

// Force TypeORM to load entity metadata
import 'reflect-metadata';

// Load appropriate environment variables based on NODE_ENV
config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

// Base connection options shared across all environments
const baseOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Explicitly enumerate entities to avoid glob pattern issues
  entities: [User, Product, Order, OrderProduct, Payment],
  synchronize: false, // Should be true only in development
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
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
  };
} else {
  dataSourceOptions = {
    ...baseOptions,
    database: process.env.DB_DATABASE || 'storefront',
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

// Create the AppDataSource (this doesn't connect yet, just configures)
export const AppDataSource = new DataSource(dataSourceOptions);

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
