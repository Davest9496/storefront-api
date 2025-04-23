"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
(0, dotenv_1.config)();
async function updateAlexPassword() {
    const client = new pg_1.Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'ecommerce',
        ssl: { rejectUnauthorized: false },
    });
    try {
        // Connect to the database
        logger_1.default.info('Connecting to database...');
        await client.connect();
        logger_1.default.info('Connected to database');
        // Create a new password hash
        const plainPassword = 'password123';
        const hashedPassword = await bcryptjs_1.default.hash(plainPassword, 10);
        logger_1.default.info(`Generated new hash for "${plainPassword}": ${hashedPassword}`);
        // Update Alex's password
        await client.query("UPDATE users SET password_digest = $1 WHERE email = 'alex.smith@example.com'", [hashedPassword]);
        logger_1.default.info(`Password updated for alex.smith@example.com`);
    }
    catch (error) {
        logger_1.default.error('Error updating password:', error);
    }
    finally {
        await client.end();
        logger_1.default.info('Database connection closed');
    }
}
// Run the script
updateAlexPassword()
    .then(() => {
    logger_1.default.info('Password update completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
