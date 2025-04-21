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
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // Enable connection reuse
  context.callbackWaitsForEmptyEventLoop = false;

  // Log the event for debugging (only path and method to avoid excessive logs)
  logger.info(`Lambda invoked: ${event.httpMethod} ${event.path}`);

  try {
    // For health check, attempt a quick database connection
    if (
      event.path === '/health' ||
      event.path === '/api/health' ||
      event.path.endsWith('/health')
    ) {
      let dbConnected = false;

      // Only try to connect if not already connected
      if (!AppDataSource.isInitialized) {
        try {
          // Try to connect with a short timeout for health checks
          dbConnected = await connectToDatabase(2000);
        } catch (err) {
          logger.warn('Health check database connection attempt failed:', err);
          dbConnected = false;
        }
      } else {
        // Already connected, run a simple query to verify
        try {
          await AppDataSource.query('SELECT 1');
          dbConnected = true;
        } catch (err) {
          logger.error('Database is initialized but query failed:', err);
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
    if (event.path.includes('/api/') && !AppDataSource.isInitialized) {
      try {
        await connectToDatabase();
      } catch (err) {
        logger.warn('API route database connection attempt failed, continuing anyway:', err);
      }
    }

    // Process the request with Express app
    return (await serverlessHandler(event, context)) as APIGatewayProxyResult;
  } catch (error) {
    logger.error('Error handling Lambda request:', error);

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
