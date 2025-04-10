import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Express } from 'express';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { Payment } from '../entities/payment.entity';
import logger from '../utils/logger';

// Load test environment variables
config({ path: '.env.test' });

// Create a special test data source
export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'storefront_test',
  synchronize: true,
  dropSchema: true,
  entities: [User, Product, Order, OrderProduct, Payment],
  logging: false,
});

// Override the imported AppDataSource in your application
jest.mock('../config/database', () => {
  // Initialize and return our test data source
  return {
    __esModule: true,
    default: TestDataSource,
  };
});

// Initialize the test database
export async function initializeTestApp(): Promise<Express> {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
    logger.info('Test database initialized'); // Use logger instead of console
  }

  // Use dynamic import instead of require
  const appModule = await import('../app');
  return appModule.default;
}

// Close the test database
export async function closeTestApp(): Promise<void> {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
    logger.info('Test database connection closed'); // Use logger instead of console
  }
}
