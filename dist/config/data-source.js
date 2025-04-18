"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.resetDatabase = resetDatabase;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const user_entity_1 = require("../entities/user.entity");
const product_entity_1 = require("../entities/product.entity");
const order_entity_1 = require("../entities/order.entity");
const order_product_entity_1 = require("../entities/order-product.entity");
const payment_entity_1 = require("../entities/payment.entity");
const logger_1 = __importDefault(require("../utils/logger"));
// Force TypeORM to load entity metadata
require("reflect-metadata");
// Load appropriate environment variables based on NODE_ENV
(0, dotenv_1.config)({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
// Log database connection parameters (without password)
logger_1.default.info('Database configuration:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    env: process.env.NODE_ENV,
    url: process.env.DATABASE_URL ? '[REDACTED]' : undefined,
});
// Base connection options shared across all environments
const baseOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Explicitly enumerate entities to avoid glob pattern issues
    entities: [user_entity_1.User, product_entity_1.Product, order_entity_1.Order, order_product_entity_1.OrderProduct, payment_entity_1.Payment],
    synchronize: false, // Should be true only in development
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    // Add connection timeout settings
    connectTimeoutMS: 5000, // 5 second timeout
    extra: {
        // Maximum number of connections in the pool
        max: 5,
        // Minimum number of connections in the pool
        min: 1,
        // Maximum time (in milliseconds) that a connection can be idle before being released
        idleTimeoutMillis: 10000,
        // Maximum time (in milliseconds) to wait for a connection from the pool
        connectionTimeoutMillis: 2000,
    },
};
// Configure data source based on environment
let dataSourceOptions;
if (process.env.NODE_ENV === 'test') {
    dataSourceOptions = {
        ...baseOptions,
        database: process.env.DB_DATABASE || 'storefront_test',
        synchronize: true,
        dropSchema: true,
        logging: false,
    };
}
else {
    dataSourceOptions = {
        ...baseOptions,
        database: process.env.DB_DATABASE || 'storefront',
        migrations: [path_1.default.join(__dirname, '../migrations/**/*.{js,ts}')],
        migrationsTableName: 'migrations',
        url: process.env.DATABASE_URL ||
            `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
        ssl: { rejectUnauthorized: false },
    };
}
// Create the AppDataSource (this doesn't connect yet, just configures)
exports.AppDataSource = new typeorm_1.DataSource(dataSourceOptions);
// For easier testing, we'll provide a specific function to reset the connection
async function resetDatabase() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('resetDatabase should only be called in test environment');
    }
    if (exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.destroy();
    }
    await exports.AppDataSource.initialize();
}
exports.default = exports.AppDataSource;
