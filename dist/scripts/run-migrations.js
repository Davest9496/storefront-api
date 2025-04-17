"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
async function runMigrations() {
    try {
        // Initialize DataSource
        logger_1.default.info('Initializing database connection...');
        await database_1.default.initialize();
        logger_1.default.info('Database connection initialized successfully');
        // Run migrations
        logger_1.default.info('Running migrations...');
        const migrations = await database_1.default.runMigrations({ transaction: 'all' });
        if (migrations.length === 0) {
            logger_1.default.info('No migrations to run. Database is up to date.');
        }
        else {
            logger_1.default.info(`Successfully ran ${migrations.length} migrations:`);
            migrations.forEach((migration) => {
                logger_1.default.info(`- ${migration.name}`);
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error running migrations:', error);
        throw error;
    }
    finally {
        // Close connection if it was initialized
        if (database_1.default.isInitialized) {
            await database_1.default.destroy();
            logger_1.default.info('Database connection closed');
        }
    }
}
// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
exports.default = runMigrations;
