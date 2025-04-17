"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const logger_1 = __importDefault(require("./utils/logger"));
// Initialize database connection
let isDbConnected = false;
// Enhanced database connection logging
const connectToDatabase = async () => {
    if (!isDbConnected && !database_1.default.isInitialized) {
        try {
            logger_1.default.info('Attempting to connect to database...');
            logger_1.default.info('Database connection params:', {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                database: process.env.DB_DATABASE,
                username: process.env.DB_USERNAME ? '******' : undefined,
            });
            // Try to initialize database with timeout
            await database_1.default.initialize();
            logger_1.default.info('Database connection established in Lambda');
            isDbConnected = true;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error during database initialization:', error);
            return false;
        }
    }
    return database_1.default.isInitialized;
};
// Create serverless handler
const serverlessHandler = (0, serverless_http_1.default)(app_1.default);
// Lambda handler
const handler = async (event, context) => {
    // Enable connection reuse
    context.callbackWaitsForEmptyEventLoop = false;
    // Log the event for debugging
    logger_1.default.info('Lambda invoked with event:', JSON.stringify({
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
        queryStringParameters: event.queryStringParameters,
    }));
    try {
        // Handle health check directly without connecting to the database
        if (event.path === '/health' ||
            event.path === '/dev/health' ||
            event.path.endsWith('/health')) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    status: 'ok',
                    message: 'Service is healthy',
                    timestamp: new Date().toISOString(),
                    path: event.path,
                    dbConnected: database_1.default.isInitialized,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                },
            };
        }
        // Try to connect to database for API routes, but with a timeout
        if (event.path.includes('/api/')) {
            // We don't await here - just fire it off and continue processing
            // This is intentional - we'll use fallback data if it fails
            connectToDatabase().catch((err) => {
                logger_1.default.error('Background database connection failed:', err);
            });
        }
        // Process the request with Express app (which will use fallbacks if needed)
        return (await serverlessHandler(event, context));
    }
    catch (error) {
        logger_1.default.error('Error handling request:', error);
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
