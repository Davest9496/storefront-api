import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { Payment } from '../entities/payment.entity';

// Load test environment variables
config({ path: '.env.test' });

// Create a test-specific database connection
const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'storefront_test',
  entities: [User, Product, Order, OrderProduct, Payment],
  synchronize: true, // For testing, we can synchronize the schema
  logging: false,
});

export default TestDataSource;
