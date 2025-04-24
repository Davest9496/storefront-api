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
// src/lambda.ts - Add this section to enhance error reporting
const handler = async (event, context) => {
    // Enable connection reuse
    context.callbackWaitsForEmptyEventLoop = false;
    // Log request info
    logger_1.default.info(`Lambda invoked: ${event.httpMethod} ${event.path}`);
    try {
        // For health check endpoint, return detailed connection info
        if (event.path === '/health' || event.path === '/api/health') {
            let dbConnected = false;
            let connectionError = null;
            let connectionStatus = 'not_attempted';
            try {
                if (!data_source_2.default.isInitialized) {
                    connectionStatus = 'connecting';
                    await connectToDatabase(3000); // 3 second timeout for health checks
                }
                // Test the connection with a simple query
                await data_source_2.default.query('SELECT 1 as connection_test');
                dbConnected = true;
                connectionStatus = 'connected';
            }
            catch (err) {
                connectionError = err instanceof Error ? err.message : String(err);
                connectionStatus = 'failed';
                logger_1.default.error('Health check database connection failed:', err);
            }
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    status: 'ok',
                    database: {
                        connected: dbConnected,
                        initialized: data_source_2.default.isInitialized,
                        status: connectionStatus,
                        error: connectionError,
                    },
                    environment: {
                        nodeEnv: process.env.NODE_ENV,
                        region: process.env.AWS_REGION,
                        hasDbHost: !!process.env.DB_HOST,
                        hasDbUser: !!process.env.DB_USERNAME,
                        hasDbPassword: !!process.env.DB_PASSWORD,
                        hasDbName: !!process.env.DB_DATABASE,
                    },
                    timestamp: new Date().toISOString(),
                }),
            };
        }
        // Ensure database is connected for API routes
        if (event.path.startsWith('/api/') && !data_source_2.default.isInitialized) {
            try {
                logger_1.default.info('API route requested, initializing database connection');
                await connectToDatabase();
            }
            catch (error) {
                logger_1.default.error('Failed to connect to database for API route:', error);
                // Return a friendly database connection error
                return {
                    statusCode: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                        status: 'error',
                        message: 'Database connection failed',
                        error: error instanceof Error ? error.message : String(error),
                    }),
                };
            }
        }
        // Process the request with Express app
        return (await serverlessHandler(event, context));
    }
    catch (error) {
        logger_1.default.error('Unhandled error in Lambda handler:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' && error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred',
            }),
        };
    }
};
exports.handler = handler;
