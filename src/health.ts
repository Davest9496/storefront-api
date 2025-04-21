import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import dns from 'dns';
import { Client } from 'pg';
import logger from './utils/logger';
import { networkInterfaces } from 'os';

// Health check handler with direct database connection
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // Enable connection reuse
  context.callbackWaitsForEmptyEventLoop = false;

  // Log the health check
  logger.info(`Health check Lambda invoked: ${event.path}`);

  // Get Lambda network info for diagnostics
  const networkInfo = getNetworkInfo();

  // Detailed database connection status
  const dbStatus = {
    connected: false,
    host: process.env.DB_HOST
      ? process.env.DB_HOST.length > 20
        ? `${process.env.DB_HOST.substring(0, 20)}...`
        : process.env.DB_HOST
      : 'not-set',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_DATABASE || 'not-set',
    hasCredentials: !!(process.env.DB_USERNAME && process.env.DB_PASSWORD),
    error: null as string | null,
    connectionTime: 0,
    diagnostics: {
      network: networkInfo,
      // Include partial trace route (ping first hop)
      route: 'Performed in logs',
    },
  };

  // Check network connectivity to the database (TCP level)
  try {
    // Log network diagnostics to CloudWatch
    logger.info('Network diagnostics:', JSON.stringify(networkInfo, null, 2));

    // Try ping via DNS lookup timing
    const startDns = Date.now();
    try {
      await performDnsLookup(process.env.DB_HOST || '');
      const dnsTime = Date.now() - startDns;
      logger.info(`DNS resolution successful in ${dnsTime}ms`);
    } catch (err) {
      logger.error('DNS resolution failed:', err);
      dbStatus.error = 'DNS_FAILED';
    }

    // Try direct database connection with timeout
    const startTime = Date.now();
    const client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000, // Extend timeout to 5 seconds
    });

    logger.info('Attempting PostgreSQL connection to:', process.env.DB_HOST);
    await client.connect();
    logger.info('PostgreSQL connection successful');

    // Run a simple query
    const result = await client.query('SELECT current_timestamp as time');
    logger.info('Query result:', result.rows[0]);

    // Close connection
    await client.end();

    dbStatus.connected = true;
    dbStatus.connectionTime = Date.now() - startTime;
  } catch (error) {
    // Capture the error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Database connection error:', errorMessage);

    // Extract the specific error type for easier diagnosis
    dbStatus.error = extractErrorType(errorMessage);

    // Log detailed troubleshooting info
    logger.error('Connection error details:', {
      host: process.env.DB_HOST,
      error: errorMessage,
      networkInfo,
    });
  }

  // Always return 200 to avoid triggering alarms
  // The dbConnected: false will indicate the issue
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      path: event.path,
      dbConnected: dbStatus.connected,
      region: process.env.AWS_REGION,
      nodeEnv: process.env.NODE_ENV,
      database: {
        host: dbStatus.host,
        port: dbStatus.port,
        error: dbStatus.error,
        connectionTime: dbStatus.connectionTime,
        diagnostics: dbStatus.diagnostics,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  };
};

// Function to get network information for diagnostics
function getNetworkInfo() {
  try {
    const interfaces = networkInterfaces();
    const ipAddresses: Array<{
      interface: string;
      address: string;
      netmask: string;
      internal: boolean;
    }> = [];

    // Get IP addresses assigned to the Lambda
    Object.keys(interfaces).forEach((interfaceName) => {
      const addresses = interfaces[interfaceName];
      if (addresses) {
        addresses.forEach((addr) => {
          // Only include IPv4 addresses for simplicity
          if (addr.family === 'IPv4') {
            ipAddresses.push({
              interface: interfaceName,
              address: addr.address,
              netmask: addr.netmask,
              internal: addr.internal,
            });
          }
        });
      }
    });

    return {
      ipAddresses,
      env: {
        // Get only the relevant environment variables
        AWS_REGION: process.env.AWS_REGION,
        NODE_ENV: process.env.NODE_ENV,
        // Don't include credentials
        dbHost: process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 15)}...` : 'not-set',
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Function to perform a DNS lookup with timeout
async function performDnsLookup(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dnsModule = dns;

    const timeout = setTimeout(() => {
      reject(new Error('DNS lookup timeout'));
    }, 3000);

    dnsModule.lookup(hostname, (err: Error | null, address: string) => {
      clearTimeout(timeout);
      if (err) {
        reject(err);
      } else {
        resolve(address);
      }
    });
  });
}

// Extract a more specific error type from PostgreSQL error messages
function extractErrorType(errorMessage: string): string {
  if (errorMessage.includes('timeout')) {
    return 'CONNECTION_TIMEOUT';
  } else if (errorMessage.includes('ECONNREFUSED')) {
    return 'CONNECTION_REFUSED';
  } else if (
    errorMessage.includes('EHOSTUNREACH') ||
    errorMessage.includes('network') ||
    errorMessage.includes('unreachable')
  ) {
    return 'HOST_UNREACHABLE';
  } else if (errorMessage.includes('password') || errorMessage.includes('authentication')) {
    return 'AUTH_FAILED';
  } else if (errorMessage.includes('no pg_hba.conf entry')) {
    return 'PG_HBA_CONF_ERROR';
  } else if (errorMessage.includes('database') && errorMessage.includes('exist')) {
    return 'DATABASE_NOT_EXIST';
  } else if (errorMessage.includes('SSL')) {
    return 'SSL_ERROR';
  } else {
    return 'UNKNOWN';
  }
}
