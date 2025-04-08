import { Client } from 'pg';
import { config } from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
config();

async function setupDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ecommerce',
  });

  try {
    // Connect to the database
    logger.info('Connecting to database...');
    await client.connect();
    logger.info('Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // Read the migration SQL file (the up function from the migration)
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

    // Execute the migration SQL
    logger.info('Setting up database schema...');
    await client.query(migrationUpSql);

    // Read the seed SQL
    const seedSql = `
      -- Populate Users table with test data
      INSERT INTO users (first_name, last_name, email, password_digest) VALUES
      ('John', 'Doe', 'john.doe@example.com', '$2b$10$xPPQQUB4gRTJK9BLON5e7.f6jpZBu0WJQAqJ0VLrDsQHnHrB8KDtC'),
      ('Jane', 'Smith', 'jane.smith@example.com', '$2b$10$xPPQQUB4gRTJK9BLON5e7.1234567890abcdefghijklmnopqrstuv');

      -- Populate Products table with headphones
      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'xx99-mark-two',
          'XX99 Mark II Headphones',
          469.99,
          'headphones',
          'The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience by reproducing the balanced depth and precision of studio-quality sound.',
          'product-xx99-mark-two-headphones',
          ARRAY[
              'Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for those who like to enjoy endless listening. It includes intuitive controls designed for any situation. Whether you are taking a business call or just in your own personal space, the auto on/off and pause features ensure that you will never miss a beat.',
              'The advanced Active Noise Cancellation with built-in equalizer allow you to experience your audio world on your terms. It lets you enjoy your audio in peace, but quickly interact with your surroundings when you need to. Combined with Bluetooth 5.0 compliant connectivity and 17 hour battery life, the XX99 Mark II headphones gives you superior sound, cutting-edge technology, and a modern design aesthetic.'
          ],
          ARRAY[
              '{"quantity": 1, "item": "Headphone Unit"}',
              '{"quantity": 2, "item": "Replacement Earcups"}',
              '{"quantity": 1, "item": "User Manual"}',
              '{"quantity": 1, "item": "3.5mm 5mm Audio Cable"}',
              '{"quantity": 1, "item": "Travel Bag"}'
          ]
      );

      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'xx99-mark-one',
          'XX99 Mark I Headphones',
          344.99,
          'headphones',
          'As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction for audiophiles, mixing engineers, and music aficionados alike in studios and on the go.',
          'product-xx99-mark-one-headphones',
          ARRAY[
              'The XX99 Mark I headphones offer a comfortable fit with their padded headband and earcups. They provide excellent sound isolation and a balanced sound profile, making them ideal for both casual listening and professional use.',
              'With a durable build and a detachable cable, the XX99 Mark I headphones are designed to last. They come with a carrying case for easy transport and storage.'
          ],
          ARRAY[
              '{"quantity": 1, "item": "Headphone Unit"}',
              '{"quantity": 1, "item": "Replacement Earcups"}',
              '{"quantity": 1, "item": "User Manual"}',
              '{"quantity": 1, "item": "3.5mm Audio Cable"}',
              '{"quantity": 1, "item": "Carrying Case"}'
          ]
      );

      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'xx59',
          'XX59 Headphones',
          599.99,
          'headphones',
          'Enjoy your audio almost anywhere and customize it to your specific tastes with the XX59 headphones. The stylish yet durable versatile wireless headset is a brilliant companion at home or on the move.',
          'product-xx59-headphones',
          ARRAY[
              'The XX59 headphones offer a sleek design and a comfortable fit. They provide a balanced sound profile with deep bass and clear highs, making them suitable for a wide range of music genres.',
              'With a long battery life and Bluetooth connectivity, the XX59 headphones are perfect for on-the-go listening. They also come with a built-in microphone for hands-free calls.'
          ],
          ARRAY[
              '{"quantity": 1, "item": "Headphone Unit"}',
              '{"quantity": 1, "item": "User Manual"}',
              '{"quantity": 1, "item": "3.5mm Audio Cable"}',
              '{"quantity": 1, "item": "Charging Cable"}'
          ]
      );

      -- Populate Products table with speakers
      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'zx9',
          'ZX9 Speaker',
          1045.00,
          'speakers',
          'Upgrade your sound system with the all new ZX9 active speaker. It''s a bookshelf speaker system that offers truly wireless connectivity -- creating new possibilities for more pleasing and practical audio setups.',
          'product-zx9-speakers',
          ARRAY[
              'The ZX9 speaker offers a powerful sound experience with its high-fidelity drivers and advanced acoustic design. It supports wireless connectivity, allowing you to stream music from your devices with ease.',
              'With a sleek and modern design, the ZX9 speaker fits seamlessly into any home decor. It also includes a remote control for convenient operation.'
          ],
          ARRAY[
              '{"quantity": 2, "item": "Speaker Units"}',
              '{"quantity": 1, "item": "Remote Control"}',
              '{"quantity": 1, "item": "User Manual"}',
              '{"quantity": 1, "item": "Power Cable"}',
              '{"quantity": 2, "item": "Speaker Stands"}'
          ]
      );

      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'zx7',
          'ZX7 Speaker',
          1248.00,
          'speakers',
          'Stream high quality sound wirelessly with minimal loss. The ZX7 bookshelf speaker uses high-end audiophile components that represents the top of the line powered speakers for home or studio use.',
          'product-zx7-speakers',
          ARRAY[
              'The ZX7 speaker delivers exceptional sound quality with its high-performance drivers and advanced crossover network. It supports both wired and wireless connections, giving you flexibility in your audio setup.',
              'With a classic design and premium build quality, the ZX7 speaker is a great addition to any audio enthusiast''s collection. It also includes a remote control for easy operation.'
          ],
          ARRAY[
              '{"quantity": 2, "item": "Speaker Units"}',
              '{"quantity": 1, "item": "Remote Control"}',
              '{"quantity": 1, "item": "User Manual"}',
              '{"quantity": 1, "item": "Power Cable"}'
          ]
      );

      -- Populate Products table with earphones
      INSERT INTO products (id, product_name, price, category, product_desc, image_name, product_features, product_accessories) VALUES
      (
          'yx1',
          'YX1 Wireless Earphones',
          499.99,
          'earphones',
          'Tailor your listening experience with bespoke dynamic drivers from the new YX1 Wireless Earphones. Enjoy incredible high-fidelity sound even in noisy environments with its active noise cancellation feature.',
          'product-yx1-earphones',
          ARRAY[
              'The YX1 wireless earphones offer a comfortable and secure fit with their ergonomic design and multiple ear tip sizes. They provide high-fidelity sound with deep bass and clear highs, making them perfect for music lovers.',
              'With active noise cancellation and a long battery life, the YX1 earphones let you enjoy your music without distractions. They also come with a charging case for convenient on-the-go charging.'
          ],
          ARRAY[
              '{"quantity": 1, "item": "Earphone Unit"}',
              '{"quantity": 3, "item": "Ear Tip Sizes"}',
              '{"quantity": 1, "item": "User Manual"}',
              '{"quantity": 1, "item": "Charging Case"}',
              '{"quantity": 1, "item": "USB-C Charging Cable"}'
          ]
      );

      -- Create some sample orders
      -- Active order for John Doe
      INSERT INTO orders (user_id, status) 
      SELECT id, 'active' FROM users WHERE email = 'john.doe@example.com';

      -- Add products to John's active order
      WITH user_order AS (
          SELECT o.id as order_id 
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE u.email = 'john.doe@example.com' AND o.status = 'active'
      )
      INSERT INTO order_products (order_id, product_id, quantity)
      SELECT 
          (SELECT order_id FROM user_order),
          'xx99-mark-two',
          2;

      -- Completed order for Jane Smith
      INSERT INTO orders (user_id, status)
      SELECT id, 'complete' FROM users WHERE email = 'jane.smith@example.com';

      -- Add products to Jane's completed order
      WITH user_order AS (
          SELECT o.id as order_id 
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE u.email = 'jane.smith@example.com' AND o.status = 'complete'
      )
      INSERT INTO order_products (order_id, product_id, quantity)
      VALUES 
          ((SELECT order_id FROM user_order), 'zx9', 1),
          ((SELECT order_id FROM user_order), 'yx1', 1);
    `;

    // Execute the seed SQL
    logger.info('Seeding database with initial data...');
    await client.query(seedSql);

    // Commit the transaction
    await client.query('COMMIT');
    logger.info('✅ Database setup and seeding completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    logger.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    // Close connection
    await client.end();
    logger.info('Database connection closed');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
