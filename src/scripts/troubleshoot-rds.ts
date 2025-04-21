import { config } from 'dotenv';
import { Client, ClientConfig } from 'pg';
import * as https from 'https';
import * as net from 'net';
import * as dns from 'dns';
import { promisify } from 'util';
import logger from '../utils/logger';

// Load environment variables
config();

// Promise versions of DNS functions
const lookup = promisify(dns.lookup);
const reverse = promisify(dns.reverse);

// Get current public IP (using a public API)
async function getPublicIP(): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get('https://api.ipify.org', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data.trim());
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Test TCP connection to database
async function testTcpConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    // Set connection timeout
    socket.setTimeout(5000);

    socket.on('connect', () => {
      logger.info(`✅ TCP connection to ${host}:${port} successful`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      logger.error(`❌ TCP connection to ${host}:${port} timed out`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      logger.error(`❌ TCP connection to ${host}:${port} failed: ${err.message}`);
      socket.destroy();
      resolve(false);
    });

    logger.info(`Attempting TCP connection to ${host}:${port}...`);
    socket.connect(port, host);
  });
}

// Test DNS resolution
async function testDnsResolution(hostname: string): Promise<string> {
  try {
    logger.info(`Resolving hostname: ${hostname}`);
    const { address, family } = await lookup(hostname);
    logger.info(`✅ Hostname resolved to IPv${family} address: ${address}`);

    try {
      const hostnames = await reverse(address);
      logger.info(`Reverse DNS: ${hostnames.join(', ')}`);
    } catch (err) {
      logger.warn(`No reverse DNS found for ${address}`);
    }

    return address;
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`❌ Failed to resolve hostname: ${err.message}`);
    } else {
      logger.error('❌ Failed to resolve hostname: Unknown error');
    }
    throw err;
  }
}

// Define a type for our connection config objects
interface ConnectionConfigTest {
  name: string;
  config: ClientConfig;
}

// Configuration options to try
const connectionConfigs: ConnectionConfigTest[] = [
  {
    name: 'Default configuration',
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: false,
      connectionTimeoutMillis: 5000,
    },
  },
  {
    name: 'With SSL enabled (rejectUnauthorized: false)',
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  },
  {
    name: "With 'postgres' database (instead of your custom database)",
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Default PostgreSQL database
      ssl: false,
      connectionTimeoutMillis: 5000,
    },
  },
  {
    name: "With SSL enabled and connecting to 'postgres' database",
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Default PostgreSQL database
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  },
];

async function tryConnection(configName: string, config: ClientConfig): Promise<boolean> {
  const client = new Client(config);

  logger.info(`\n🔄 Trying connection with: ${configName}`);
  logger.info(
    `Host: ${config.host}, User: ${config.user}, Database: ${config.database}, SSL: ${config.ssl ? 'enabled' : 'disabled'}`,
  );

  try {
    await client.connect();
    logger.info(`✅ Successfully connected with: ${configName}`);

    // Test a simple query
    const queryResult = await client.query('SELECT current_database() as db');
    logger.info(`✅ Query successful. Connected to database: ${queryResult.rows[0].db}`);

    await client.end();
    return true;
  } catch (err) {
    logger.error(`❌ Connection failed with: ${configName}`);
    logger.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);

    try {
      await client.end();
    } catch (e) {
      // Ignore errors when ending connection
    }

    return false;
  }
}

async function troubleshootRDSConnection(): Promise<void> {
  logger.info('=============================================');
  logger.info('🔍 AWS RDS POSTGRESQL CONNECTION TROUBLESHOOTER');
  logger.info('=============================================\n');

  try {
    // Get and log environment info
    logger.info('Environment Information:');
    logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

    // Get and log public IP
    const publicIP = await getPublicIP();
    logger.info(`Your public IP address: ${publicIP}`);
    logger.info(`⚠️ Make sure this IP is allowed in your RDS security group!`);

    // Test DNS resolution
    await testDnsResolution(process.env.DB_HOST || '');

    // Test TCP connection
    const tcpConnected = await testTcpConnection(
      process.env.DB_HOST || '',
      parseInt(process.env.DB_PORT || '5432', 10),
    );

    if (!tcpConnected) {
      logger.error('\n🚫 Cannot establish TCP connection to your RDS instance.');
      logger.error('This indicates a network or security group issue.');
      logger.error('Please check:');
      logger.error('1. Your RDS instance is running');
      logger.error(
        '2. Your security group allows inbound traffic on port 5432 from your IP address',
      );
      logger.error('3. There are no network ACLs blocking the connection');
      logger.error('4. Your RDS instance is publicly accessible (if connecting from outside VPC)');
      return;
    }

    logger.info('\n🔄 TCP connection successful. Testing database connections...');

    // Try all connection configurations
    let anySuccessful = false;

    for (const { name, config } of connectionConfigs) {
      const success = await tryConnection(name, config);
      if (success) {
        anySuccessful = true;
        logger.info(`\n✅ Connection successful with: ${name}`);
        logger.info('Use these settings in your application configuration.');

        // Log the successful configuration to use
        if (config.ssl) {
          logger.info('\nUpdate your data-source.ts with these SSL settings:');
          logger.info(`ssl: { rejectUnauthorized: false }`);
        }

        if (config.database === 'postgres') {
          logger.info('\nYou need to create your application database:');
          logger.info(`1. Connect to the 'postgres' database`);
          logger.info(`2. Run: CREATE DATABASE ${process.env.DB_DATABASE || 'storefront'};`);
        }

        break;
      }
    }

    if (!anySuccessful) {
      logger.error('\n❌ ALL CONNECTION ATTEMPTS FAILED');
      logger.error('\nRecommended actions:');
      logger.error('1. Check your AWS RDS instance status in the AWS console');
      logger.error('2. Verify the security group allows connections from your IP address');
      logger.error('3. Confirm your username and password are correct');
      logger.error(
        '4. If using a custom parameter group, check that password authentication is enabled',
      );
      logger.error('5. Try creating and connecting to the default "postgres" database first');
      logger.error('6. You may need to modify the pg_hba.conf settings via a parameter group');

      logger.info('\nPg_hba.conf issue:');
      logger.info(
        'The error "no pg_hba.conf entry for host" means your RDS instance is rejecting connections',
      );
      logger.info('from your IP address or for your specific user/database combination.');
      logger.info('To fix this, you need to:');
      logger.info('1. Make sure your security group allows your IP');
      logger.info('2. Try creating a custom parameter group with appropriate pg_hba.conf settings');
      logger.info('   or check if "rds.force_ssl" is enabled in your parameter group');
    }
  } catch (err) {
    logger.error('An unexpected error occurred during troubleshooting:', err);
  }
}

// Run the troubleshooter if this file is executed directly
if (require.main === module) {
  troubleshootRDSConnection()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

export default troubleshootRDSConnection;
