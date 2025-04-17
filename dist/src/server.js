"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./utils/logger"));
const database_1 = __importDefault(require("./config/database"));
// Load environment variables
(0, dotenv_1.config)();
// Set server port
const PORT = process.env.PORT || 3000;
// Function to initialize database
async function initializeDatabase() {
    try {
        await database_1.default.initialize();
        logger_1.default.info('Database connection established');
    }
    catch (error) {
        logger_1.default.error('Error during database initialization:', error);
        process.exit(1);
    }
}
// Start server function
async function startServer() {
    try {
        // Initialize database connection
        await initializeDatabase();
        // Start Express server
        const server = app_1.default.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger_1.default.info(`Health check available at http://localhost:${PORT}/health`);
        });
        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            logger_1.default.info('SIGTERM signal received: closing HTTP server');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                // Close database connection
                await database_1.default.destroy();
                logger_1.default.info('Database connection closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            logger_1.default.info('SIGINT signal received: closing HTTP server');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                // Close database connection
                await database_1.default.destroy();
                logger_1.default.info('Database connection closed');
                process.exit(0);
            });
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger_1.default.error('UNHANDLED REJECTION! Shutting down...', err);
            server.close(() => {
                process.exit(1);
            });
        });
        return server;
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server if this file is run directly
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.default.error('Uncaught server error:', error);
        process.exit(1);
    });
}
exports.default = startServer;
