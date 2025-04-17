"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = exports.closeDatabase = exports.initializeDatabase = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Initialize database connection
 */
const initializeDatabase = async () => {
    try {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
            logger_1.default.info('Database connection has been established successfully.');
        }
    }
    catch (error) {
        logger_1.default.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
/**
 * Close database connection
 */
const closeDatabase = async () => {
    try {
        if (database_1.default.isInitialized) {
            await database_1.default.destroy();
            logger_1.default.info('Database connection has been closed.');
        }
    }
    catch (error) {
        logger_1.default.error('Error closing database connection:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
/**
 * Get active database connection
 */
const getConnection = () => {
    if (!database_1.default.isInitialized) {
        throw new Error('Database connection has not been initialized. Call initializeDatabase() first.');
    }
    return database_1.default;
};
exports.getConnection = getConnection;
exports.default = {
    initializeDatabase: exports.initializeDatabase,
    closeDatabase: exports.closeDatabase,
    getConnection: exports.getConnection,
};
