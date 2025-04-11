import { Client } from 'pg';
import { config } from 'dotenv';
import logger from '../utils/logger';

// Try to load test environment variables, but don't fail if file doesn't exist
try {
  config({ path: '.env.test' });
} catch (error) {
  // Fall back to regular .env if .env.test doesn't exist
  config();
}

async function setupTestDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database first
  });

  const testDbName = process.env.DB_DATABASE || 'storefront_test';

  try {
    await client.connect();
    logger.info('Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckResult = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
      testDbName,
    ]);

    // If database exists, drop it
    if ((dbCheckResult.rowCount ?? 0) > 0) {
      logger.info(`Dropping existing test database: ${testDbName}`);
      // Terminate all connections to the database
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${testDbName}'
        AND pid <> pg_backend_pid();
      `);
      await client.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    }

    // Create fresh database
    logger.info(`Creating test database: ${testDbName}`);
    await client.query(`CREATE DATABASE ${testDbName}`);
    logger.info(`Test database created successfully`);

    // Close connection to postgres
    await client.end();

    // Connect to the newly created test database to set up schema
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: testDbName,
    });

    await testClient.connect();
    logger.info(`Connected to test database: ${testDbName}`);

    // Run migration SQL to create the schema
    await testClient.query('BEGIN');

    const migrationUpSql = `
      -- Drop existing tables and types if they exist
      DROP TABLE IF EXISTS order_products CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TYPE IF EXISTS order_status CASCADE;
      DROP TYPE IF EXISTS product_category CASCADE;
      DROP TYPE IF EXISTS payment_provider CASCADE;
      DROP TYPE IF EXISTS payment_status CASCADE;

      -- Create custom types
      CREATE TYPE order_status AS ENUM ('active', 'complete');
      CREATE TYPE product_category AS ENUM ('headphones', 'speakers', 'earphones');
      CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal');
      CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');

      -- Create users table
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_digest VARCHAR(250) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
      );

      -- Create products table
      CREATE TABLE products (
          id VARCHAR(50) PRIMARY KEY,
          product_name VARCHAR(100) NOT NULL,
          price DECIMAL(10,2) NOT NULL CHECK (price > 0),
          category product_category NOT NULL,
          product_desc VARCHAR(250),
          image_name VARCHAR(255) NOT NULL,
          product_features TEXT[],
          product_accessories TEXT[],
          is_new BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
      );

      -- Create orders table
      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          status order_status NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT fk_user 
              FOREIGN KEY (user_id) 
              REFERENCES users(id) 
              ON DELETE CASCADE
      );

      -- Create order_products join table
      CREATE TABLE order_products (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          product_id VARCHAR(50) NOT NULL,
          quantity INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT fk_order 
              FOREIGN KEY (order_id) 
              REFERENCES orders(id) 
              ON DELETE CASCADE,
          CONSTRAINT fk_product 
              FOREIGN KEY (product_id) 
              REFERENCES products(id) 
              ON DELETE CASCADE,
          CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
      );

      -- Create payments table
      CREATE TABLE payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id INTEGER NOT NULL UNIQUE,
          amount DECIMAL(10,2) NOT NULL,
          provider payment_provider NOT NULL,
          status payment_status NOT NULL DEFAULT 'pending',
          provider_transaction_id VARCHAR(255),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT fk_order
              FOREIGN KEY (order_id)
              REFERENCES orders(id)
              ON DELETE CASCADE
      );

      -- Create helpful indexes
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_orders_user_id ON orders(user_id);
      CREATE INDEX idx_order_products_order_id ON order_products(order_id);
      CREATE INDEX idx_order_products_product_id ON order_products(product_id);
      
      -- Create migrations table for TypeORM
      CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          "timestamp" BIGINT NOT NULL,
          name VARCHAR(255) NOT NULL
      );
      
      -- Record our migration as executed
      INSERT INTO migrations("timestamp", name) VALUES (1713566785629, 'Initial1713566785629');
    `;

    logger.info('Setting up test database schema...');
    await testClient.query(migrationUpSql);

    // Add minimal test data
    const testDataSql = `
      -- Populate Users table with test data
      INSERT INTO users (first_name, last_name, email, password_digest) VALUES
      ('Test', 'User', 'test@example.com', '$2b$10$xPPQQUB4gRTJK9BLON5e7.f6jpZBu0WJQAqJ0VLrDsQHnHrB8KDtC');
      
      -- Add a test product
      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'test-product',
          'Test Product',
          99.99,
          'headphones',
          'Test product description',
          'test-product-image',
          ARRAY['Feature 1', 'Feature 2'],
          ARRAY['{"quantity": 1, "item": "Test Item"}']
      );
    `;

    logger.info('Adding test data...');
    await testClient.query(testDataSql);

    // Commit transaction
    await testClient.query('COMMIT');
    logger.info('✅ Test database schema and data setup completed successfully');

    // Close test database connection
    await testClient.end();
  } catch (error) {
    logger.error('Error setting up test database:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      logger.info('Test database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unhandled error in test database setup:', error);
      process.exit(1);
    });
}

export default setupTestDatabase;
