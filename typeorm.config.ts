import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const AppDataSource = new DataSource({
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
  // UPDATED: Always use SSL with rejectUnauthorized: false for RDS connections
  ssl: { rejectUnauthorized: false },
  // Add extra settings for better RDS connection handling
  extra: {
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require',
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});

export default AppDataSource;
