import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Client } from 'pg';
import logger from './utils/logger';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;
  logger.info('Health check Lambda invoked');

  // Test database connection directly using pg client
  // This is faster than initializing TypeORM for health checks
  let dbConnected = false;
  let dbError = null;

  try {
    const client = new Client({
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
    logger.info('Health check database connection successful');
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
    logger.error('Health check database connection failed:', error);
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
