import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverless from 'serverless-http';
import app from './app';
import { initializeDatabase } from './config/data-source';
import AppDataSource from './config/data-source';
import logger from './utils/logger';

// Create a connection cache
let connectionPromise: Promise<void> | null = null;

// Initialize database connection with timeout protection
const connectToDatabase = async (timeoutMs = 5000): Promise<boolean> => {
  if (!AppDataSource.isInitialized && !connectionPromise) {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Database connection timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    try {
      logger.info('Initializing database connection from Lambda...');
      logger.info('Connection parameters:', {
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
        initializeDatabase(2, 1000), // 2 retries, 1 second between retries
        timeoutPromise,
      ]) as Promise<void>;

      // Wait for connection or timeout
      await connectionPromise;

      // Run a test query
      await AppDataSource.query('SELECT 1 as connection_test');

      logger.info('✅ Database connection successfully established in Lambda');
      return true;
    } catch (error) {
      logger.error('❌ Database connection failed in Lambda:', error);
      // Reset connection promise on failure
      connectionPromise = null;
      return false;
    }
  }

  return AppDataSource.isInitialized;
};

// Create serverless handler
const serverlessHandler = serverless(app);

// Lambda handler
// src/lambda.ts - Add this section to enhance error reporting
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // Enable connection reuse
  context.callbackWaitsForEmptyEventLoop = false;

  // Log request info
  logger.info(`Lambda invoked: ${event.httpMethod} ${event.path}`);

  try {
    // For health check endpoint, return detailed connection info
    if (event.path === '/health' || event.path === '/api/health') {
      let dbConnected = false;
      let connectionError = null;
      let connectionStatus = 'not_attempted';

      try {
        if (!AppDataSource.isInitialized) {
          connectionStatus = 'connecting';
          await connectToDatabase(3000); // 3 second timeout for health checks
        }

        // Test the connection with a simple query
        await AppDataSource.query('SELECT 1 as connection_test');
        dbConnected = true;
        connectionStatus = 'connected';
      } catch (err) {
        connectionError = err instanceof Error ? err.message : String(err);
        connectionStatus = 'failed';
        logger.error('Health check database connection failed:', err);
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
            initialized: AppDataSource.isInitialized,
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
    if (event.path.startsWith('/api/') && !AppDataSource.isInitialized) {
      try {
        logger.info('API route requested, initializing database connection');
        await connectToDatabase();
      } catch (error) {
        logger.error('Failed to connect to database for API route:', error);

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
    return (await serverlessHandler(event, context)) as APIGatewayProxyResult;
  } catch (error) {
    logger.error('Unhandled error in Lambda handler:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      }),
    };
  }
};
