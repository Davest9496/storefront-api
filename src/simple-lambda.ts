import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import logger from './utils/logger';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  logger.info('Event:', JSON.stringify(event));
  logger.info('Context:', JSON.stringify(context));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  };
};
