"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
// Load environment variables
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'storefront',
    entities: [(0, path_1.join)(__dirname, 'src/entities/**/*.entity.{js,ts}')],
    migrations: [(0, path_1.join)(__dirname, 'src/migrations/**/*.{js,ts}')],
    migrationsTableName: 'migrations',
    synchronize: false, // Never true in production
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
exports.default = AppDataSource;
