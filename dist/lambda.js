"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const app_1 = __importDefault(require("./app"));
const data_source_1 = require("./config/data-source");
const data_source_2 = __importDefault(require("./config/data-source"));
const logger_1 = __importDefault(require("./utils/logger"));
// Create a connection cache
let connectionPromise = null;
// Initialize database connection with timeout protection
const connectToDatabase = async (timeoutMs = 5000) => {
    if (!data_source_2.default.isInitialized && !connectionPromise) {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Database connection timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        try {
            logger_1.default.info('Initializing database connection from Lambda...');
            logger_1.default.info('Connection parameters:', {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                database: process.env.DB_DATABASE,
                hasUsername: !!process.env.DB_USERNAME,
                hasPassword: !!process.env.DB_PASSWORD,
                nodeEnv: process.env.NODE_ENV,
                ssl: true, // Always using SSL
            });
            // Create the connection promise
            connectionPromise = Promise.race([
                (0, data_source_1.initializeDatabase)(2, 1000), // 2 retries, 1 second between retries
                timeoutPromise,
            ]);
            // Wait for connection or timeout
            await connectionPromise;
            // Run a test query
            await data_source_2.default.query('SELECT 1 as connection_test');
            logger_1.default.info('✅ Database connection successfully established in Lambda');
            return true;
        }
        catch (error) {
            logger_1.default.error('❌ Database connection failed in Lambda:', error);
            // Reset connection promise on failure
            connectionPromise = null;
            return false;
        }
    }
    return data_source_2.default.isInitialized;
};
// Create serverless handler
const serverlessHandler = (0, serverless_http_1.default)(app_1.default);
// Lambda handler
const handler = async (event, context) => {
    // Enable connection reuse
    context.callbackWaitsForEmptyEventLoop = false;
    // Log the event for debugging (only path and method to avoid excessive logs)
    logger_1.default.info(`Lambda invoked: ${event.httpMethod} ${event.path}`);
    try {
        // For health check, attempt a quick database connection
        if (event.path === '/health' ||
            event.path === '/api/health' ||
            event.path.endsWith('/health')) {
            let dbConnected = false;
            // Only try to connect if not already connected
            if (!data_source_2.default.isInitialized) {
                try {
                    // Try to connect with a short timeout for health checks
                    dbConnected = await connectToDatabase(2000);
                }
                catch (err) {
                    logger_1.default.warn('Health check database connection attempt failed:', err);
                    dbConnected = false;
                }
            }
            else {
                // Already connected, run a simple query to verify
                try {
                    await data_source_2.default.query('SELECT 1');
                    dbConnected = true;
                }
                catch (err) {
                    logger_1.default.error('Database is initialized but query failed:', err);
                    dbConnected = false;
                }
            }
            return {
                statusCode: 200,
                body: JSON.stringify({
                    status: 'ok',
                    message: 'Service is healthy',
                    timestamp: new Date().toISOString(),
                    path: event.path,
                    dbConnected,
                    region: process.env.AWS_REGION,
                    nodeEnv: process.env.NODE_ENV,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                },
            };
        }
        // For other API routes, ensure database connection
        if (event.path.includes('/api/') && !data_source_2.default.isInitialized) {
            try {
                await connectToDatabase();
            }
            catch (err) {
                logger_1.default.warn('API route database connection attempt failed, continuing anyway:', err);
            }
        }
        // Process the request with Express app
        return (await serverlessHandler(event, context));
    }
    catch (error) {
        logger_1.default.error('Error handling Lambda request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error',
                path: event.path,
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
            },
        };
    }
};
exports.handler = handler;
