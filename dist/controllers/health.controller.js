"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * @desc    Health check endpoint
 * @route   GET /health
 * @access  Public
 */
// In src/controllers/health.controller.ts
const healthCheck = async (req, res) => {
    try {
        const healthcheck = {
            status: 'ok',
            message: 'Service is healthy',
            timestamp: new Date().toISOString(),
            path: req.path,
            dbConnected: database_1.default.isInitialized,
        };
        // Check database connection
        if (database_1.default.isInitialized) {
            try {
                // Run a simple query to verify the connection is working
                await database_1.default.query('SELECT 1');
                healthcheck.dbConnected = true;
            }
            catch (dbError) {
                logger_1.default.error('Database ping failed despite initialized connection:', dbError);
                healthcheck.dbConnected = false;
            }
        }
        logger_1.default.info(`Health check successful: ${JSON.stringify(healthcheck)}`);
        res.status(200).json(healthcheck);
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(503).json({
            status: 'error',
            message: 'Service Unavailable',
            timestamp: new Date().toISOString(),
            dbConnected: false,
        });
    }
};
exports.healthCheck = healthCheck;
