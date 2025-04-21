"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const pg_1 = require("pg");
const https = __importStar(require("https"));
const net = __importStar(require("net"));
const dns = __importStar(require("dns"));
const util_1 = require("util");
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
(0, dotenv_1.config)();
// Promise versions of DNS functions
const lookup = (0, util_1.promisify)(dns.lookup);
const reverse = (0, util_1.promisify)(dns.reverse);
// Get current public IP (using a public API)
async function getPublicIP() {
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
async function testTcpConnection(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        // Set connection timeout
        socket.setTimeout(5000);
        socket.on('connect', () => {
            logger_1.default.info(`✅ TCP connection to ${host}:${port} successful`);
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            logger_1.default.error(`❌ TCP connection to ${host}:${port} timed out`);
            socket.destroy();
            resolve(false);
        });
        socket.on('error', (err) => {
            logger_1.default.error(`❌ TCP connection to ${host}:${port} failed: ${err.message}`);
            socket.destroy();
            resolve(false);
        });
        logger_1.default.info(`Attempting TCP connection to ${host}:${port}...`);
        socket.connect(port, host);
    });
}
// Test DNS resolution
async function testDnsResolution(hostname) {
    try {
        logger_1.default.info(`Resolving hostname: ${hostname}`);
        const { address, family } = await lookup(hostname);
        logger_1.default.info(`✅ Hostname resolved to IPv${family} address: ${address}`);
        try {
            const hostnames = await reverse(address);
            logger_1.default.info(`Reverse DNS: ${hostnames.join(', ')}`);
        }
        catch (err) {
            logger_1.default.warn(`No reverse DNS found for ${address}`);
        }
        return address;
    }
    catch (err) {
        if (err instanceof Error) {
            logger_1.default.error(`❌ Failed to resolve hostname: ${err.message}`);
        }
        else {
            logger_1.default.error('❌ Failed to resolve hostname: Unknown error');
        }
        throw err;
    }
}
// Configuration options to try
const connectionConfigs = [
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
async function tryConnection(configName, config) {
    const client = new pg_1.Client(config);
    logger_1.default.info(`\n🔄 Trying connection with: ${configName}`);
    logger_1.default.info(`Host: ${config.host}, User: ${config.user}, Database: ${config.database}, SSL: ${config.ssl ? 'enabled' : 'disabled'}`);
    try {
        await client.connect();
        logger_1.default.info(`✅ Successfully connected with: ${configName}`);
        // Test a simple query
        const queryResult = await client.query('SELECT current_database() as db');
        logger_1.default.info(`✅ Query successful. Connected to database: ${queryResult.rows[0].db}`);
        await client.end();
        return true;
    }
    catch (err) {
        logger_1.default.error(`❌ Connection failed with: ${configName}`);
        logger_1.default.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        try {
            await client.end();
        }
        catch (e) {
            // Ignore errors when ending connection
        }
        return false;
    }
}
async function troubleshootRDSConnection() {
    logger_1.default.info('=============================================');
    logger_1.default.info('🔍 AWS RDS POSTGRESQL CONNECTION TROUBLESHOOTER');
    logger_1.default.info('=============================================\n');
    try {
        // Get and log environment info
        logger_1.default.info('Environment Information:');
        logger_1.default.info(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
        // Get and log public IP
        const publicIP = await getPublicIP();
        logger_1.default.info(`Your public IP address: ${publicIP}`);
        logger_1.default.info(`⚠️ Make sure this IP is allowed in your RDS security group!`);
        // Test DNS resolution
        await testDnsResolution(process.env.DB_HOST || '');
        // Test TCP connection
        const tcpConnected = await testTcpConnection(process.env.DB_HOST || '', parseInt(process.env.DB_PORT || '5432', 10));
        if (!tcpConnected) {
            logger_1.default.error('\n🚫 Cannot establish TCP connection to your RDS instance.');
            logger_1.default.error('This indicates a network or security group issue.');
            logger_1.default.error('Please check:');
            logger_1.default.error('1. Your RDS instance is running');
            logger_1.default.error('2. Your security group allows inbound traffic on port 5432 from your IP address');
            logger_1.default.error('3. There are no network ACLs blocking the connection');
            logger_1.default.error('4. Your RDS instance is publicly accessible (if connecting from outside VPC)');
            return;
        }
        logger_1.default.info('\n🔄 TCP connection successful. Testing database connections...');
        // Try all connection configurations
        let anySuccessful = false;
        for (const { name, config } of connectionConfigs) {
            const success = await tryConnection(name, config);
            if (success) {
                anySuccessful = true;
                logger_1.default.info(`\n✅ Connection successful with: ${name}`);
                logger_1.default.info('Use these settings in your application configuration.');
                // Log the successful configuration to use
                if (config.ssl) {
                    logger_1.default.info('\nUpdate your data-source.ts with these SSL settings:');
                    logger_1.default.info(`ssl: { rejectUnauthorized: false }`);
                }
                if (config.database === 'postgres') {
                    logger_1.default.info('\nYou need to create your application database:');
                    logger_1.default.info(`1. Connect to the 'postgres' database`);
                    logger_1.default.info(`2. Run: CREATE DATABASE ${process.env.DB_DATABASE || 'storefront'};`);
                }
                break;
            }
        }
        if (!anySuccessful) {
            logger_1.default.error('\n❌ ALL CONNECTION ATTEMPTS FAILED');
            logger_1.default.error('\nRecommended actions:');
            logger_1.default.error('1. Check your AWS RDS instance status in the AWS console');
            logger_1.default.error('2. Verify the security group allows connections from your IP address');
            logger_1.default.error('3. Confirm your username and password are correct');
            logger_1.default.error('4. If using a custom parameter group, check that password authentication is enabled');
            logger_1.default.error('5. Try creating and connecting to the default "postgres" database first');
            logger_1.default.error('6. You may need to modify the pg_hba.conf settings via a parameter group');
            logger_1.default.info('\nPg_hba.conf issue:');
            logger_1.default.info('The error "no pg_hba.conf entry for host" means your RDS instance is rejecting connections');
            logger_1.default.info('from your IP address or for your specific user/database combination.');
            logger_1.default.info('To fix this, you need to:');
            logger_1.default.info('1. Make sure your security group allows your IP');
            logger_1.default.info('2. Try creating a custom parameter group with appropriate pg_hba.conf settings');
            logger_1.default.info('   or check if "rds.force_ssl" is enabled in your parameter group');
        }
    }
    catch (err) {
        logger_1.default.error('An unexpected error occurred during troubleshooting:', err);
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
exports.default = troubleshootRDSConnection;
