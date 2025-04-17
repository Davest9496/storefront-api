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
const healthCheck = async (req, res) => {
    try {
        const healthcheck = {
            uptime: process.uptime(),
            message: 'OK',
            timestamp: Date.now(),
            database: 'Disconnected',
        };
        // Check database connection
        if (database_1.default.isInitialized) {
            healthcheck.database = 'Connected';
        }
        logger_1.default.info(`Health check successful: ${JSON.stringify(healthcheck)}`);
        res.status(200).json(healthcheck);
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(503).json({
            uptime: process.uptime(),
            message: 'Service Unavailable',
            timestamp: Date.now(),
        });
    }
};
exports.healthCheck = healthCheck;
