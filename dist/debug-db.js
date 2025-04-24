"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./utils/logger"));
const handler = async (_event) => {
    logger_1.default.info('Debug DB connection Lambda invoked');
    const response = {
        ssm: {
            dbHost: process.env.DB_HOST || 'missing',
            dbPort: process.env.DB_PORT || 'missing',
            dbName: process.env.DB_DATABASE || 'missing',
            dbUser: process.env.DB_USERNAME ? 'set' : 'missing',
            dbPass: process.env.DB_PASSWORD ? 'set' : 'missing',
            sslEnabled: process.env.DB_USE_SSL || 'missing',
        },
        vpc: {
            lambdaSecurityGroup: 'sg-059642d97326cb72f',
            lambdaSubnets: [
                'subnet-0ef8327e8c86f38c5',
                'subnet-02048d123728927ea',
                'subnet-02433fd3ced24f68e',
            ],
        },
        directConnection: {
            status: 'pending',
            error: null,
            result: null,
            timing: 0,
        },
    };
    try {
        // Try direct PostgreSQL connection
        const startTime = Date.now();
        const client = new pg_1.Client({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000, // 5 second timeout
        });
        await client.connect();
        const result = await client.query('SELECT NOW() as time, current_user as user, current_database() as db');
        await client.end();
        const endTime = Date.now();
        response.directConnection = {
            status: 'success',
            error: null,
            result: result.rows[0],
            timing: endTime - startTime,
        };
        logger_1.default.info('Database connection successful');
    }
    catch (error) {
        response.directConnection = {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            result: null,
            timing: 0,
        };
        logger_1.default.error('Database connection failed:', error);
    }
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response, null, 2),
    };
};
exports.handler = handler;
