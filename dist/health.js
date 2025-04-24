"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./utils/logger"));
const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    logger_1.default.info('Health check Lambda invoked');
    // Test database connection directly using pg client
    // This is faster than initializing TypeORM for health checks
    let dbConnected = false;
    let dbError = null;
    try {
        const client = new pg_1.Client({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            ssl: { rejectUnauthorized: false },
            // Short timeout for health checks
            connectionTimeoutMillis: 3000,
        });
        await client.connect();
        const result = await client.query('SELECT 1 as connection_test');
        await client.end();
        dbConnected = result.rows[0].connection_test === 1;
        logger_1.default.info('Health check database connection successful');
    }
    catch (error) {
        dbError = error instanceof Error ? error.message : String(error);
        logger_1.default.error('Health check database connection failed:', error);
    }
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            status: 'ok',
            service: 'storefront-api',
            version: '1.0.0',
            database: {
                connected: dbConnected,
                error: dbError,
            },
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        }),
    };
};
exports.handler = handler;
