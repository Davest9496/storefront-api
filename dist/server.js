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
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./utils/logger"));
const data_source_1 = require("./config/data-source");
// Load environment variables
(0, dotenv_1.config)();
// Set server port
const PORT = process.env.PORT || 3000;
// Start server function
async function startServer() {
    try {
        // Initialize database connection with retry capability
        await (0, data_source_1.initializeDatabase)(5, 3000); // 5 retries, 3 second delay between retries
        // Start Express server
        const server = app_1.default.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger_1.default.info(`API available at http://localhost:${PORT}/api`);
        });
        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            logger_1.default.info('SIGTERM signal received: closing HTTP server');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                // Close database connection
                const AppDataSource = (await Promise.resolve().then(() => __importStar(require('./config/data-source')))).default;
                if (AppDataSource.isInitialized) {
                    await AppDataSource.destroy();
                    logger_1.default.info('Database connection closed');
                }
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            logger_1.default.info('SIGINT signal received: closing HTTP server');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                // Close database connection
                const AppDataSource = (await Promise.resolve().then(() => __importStar(require('./config/data-source')))).default;
                if (AppDataSource.isInitialized) {
                    await AppDataSource.destroy();
                    logger_1.default.info('Database connection closed');
                }
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
