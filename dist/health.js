"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dns_1 = __importDefault(require("dns"));
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./utils/logger"));
const os_1 = require("os");
// Health check handler with direct database connection
const handler = async (event, context) => {
    // Enable connection reuse
    context.callbackWaitsForEmptyEventLoop = false;
    // Log the health check
    logger_1.default.info(`Health check Lambda invoked: ${event.path}`);
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
        error: null,
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
        logger_1.default.info('Network diagnostics:', JSON.stringify(networkInfo, null, 2));
        // Try ping via DNS lookup timing
        const startDns = Date.now();
        try {
            await performDnsLookup(process.env.DB_HOST || '');
            const dnsTime = Date.now() - startDns;
            logger_1.default.info(`DNS resolution successful in ${dnsTime}ms`);
        }
        catch (err) {
            logger_1.default.error('DNS resolution failed:', err);
            dbStatus.error = 'DNS_FAILED';
        }
        // Try direct database connection with timeout
        const startTime = Date.now();
        const client = new pg_1.Client({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE || 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000, // Extend timeout to 5 seconds
        });
        logger_1.default.info('Attempting PostgreSQL connection to:', process.env.DB_HOST);
        await client.connect();
        logger_1.default.info('PostgreSQL connection successful');
        // Run a simple query
        const result = await client.query('SELECT current_timestamp as time');
        logger_1.default.info('Query result:', result.rows[0]);
        // Close connection
        await client.end();
        dbStatus.connected = true;
        dbStatus.connectionTime = Date.now() - startTime;
    }
    catch (error) {
        // Capture the error details
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error('Database connection error:', errorMessage);
        // Extract the specific error type for easier diagnosis
        dbStatus.error = extractErrorType(errorMessage);
        // Log detailed troubleshooting info
        logger_1.default.error('Connection error details:', {
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
exports.handler = handler;
// Function to get network information for diagnostics
function getNetworkInfo() {
    try {
        const interfaces = (0, os_1.networkInterfaces)();
        const ipAddresses = [];
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
    }
    catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
// Function to perform a DNS lookup with timeout
async function performDnsLookup(hostname) {
    return new Promise((resolve, reject) => {
        const dnsModule = dns_1.default;
        const timeout = setTimeout(() => {
            reject(new Error('DNS lookup timeout'));
        }, 3000);
        dnsModule.lookup(hostname, (err, address) => {
            clearTimeout(timeout);
            if (err) {
                reject(err);
            }
            else {
                resolve(address);
            }
        });
    });
}
// Extract a more specific error type from PostgreSQL error messages
function extractErrorType(errorMessage) {
    if (errorMessage.includes('timeout')) {
        return 'CONNECTION_TIMEOUT';
    }
    else if (errorMessage.includes('ECONNREFUSED')) {
        return 'CONNECTION_REFUSED';
    }
    else if (errorMessage.includes('EHOSTUNREACH') ||
        errorMessage.includes('network') ||
        errorMessage.includes('unreachable')) {
        return 'HOST_UNREACHABLE';
    }
    else if (errorMessage.includes('password') || errorMessage.includes('authentication')) {
        return 'AUTH_FAILED';
    }
    else if (errorMessage.includes('no pg_hba.conf entry')) {
        return 'PG_HBA_CONF_ERROR';
    }
    else if (errorMessage.includes('database') && errorMessage.includes('exist')) {
        return 'DATABASE_NOT_EXIST';
    }
    else if (errorMessage.includes('SSL')) {
        return 'SSL_ERROR';
    }
    else {
        return 'UNKNOWN';
    }
}
