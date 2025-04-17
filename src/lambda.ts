import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverless from 'serverless-http';
import app from './app';
import AppDataSource from './config/database';
import logger from './utils/logger';

// Initialize database connection
let isDbConnected = false;

// Enhanced database connection logging
const connectToDatabase = async (): Promise<boolean> => {
  if (!isDbConnected && !AppDataSource.isInitialized) {
    try {
      logger.info('Attempting to connect to database...');
      logger.info('Database connection params:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        username: process.env.DB_USERNAME ? '******' : undefined,
      });

      // Try to initialize database with timeout
      await AppDataSource.initialize();

      logger.info('Database connection established in Lambda');
      isDbConnected = true;
      return true;
    } catch (error) {
      logger.error('Error during database initialization:', error);
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

  // Log the event for debugging
  logger.info(
    'Lambda invoked with event:',
    JSON.stringify({
      path: event.path,
      httpMethod: event.httpMethod,
      headers: event.headers,
      queryStringParameters: event.queryStringParameters,
    }),
  );

  try {
    // Handle health check directly without connecting to the database
    if (
      event.path === '/health' ||
      event.path === '/dev/health' ||
      event.path.endsWith('/health')
    ) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'ok',
          message: 'Service is healthy',
          timestamp: new Date().toISOString(),
          path: event.path,
          dbConnected: AppDataSource.isInitialized,
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
        logger.error('Background database connection failed:', err);
      });
    }

    // Process the request with Express app (which will use fallbacks if needed)
    return (await serverlessHandler(event, context)) as APIGatewayProxyResult;
  } catch (error) {
    logger.error('Error handling request:', error);

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
