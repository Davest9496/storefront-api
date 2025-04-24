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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
const logger_1 = __importStar(require("./utils/logger"));
const data_source_1 = __importDefault(require("./config/data-source"));
// Load environment variables
(0, dotenv_1.config)();
// Import middleware
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
// Create Express app
const app = (0, express_1.default)();
// IMPORTANT: Set trust proxy to true to fix the X-Forwarded-For header issue with API Gateway
app.set('trust proxy', true);
// Define API prefix
const API_PREFIX = process.env.API_PREFIX || '/api';
// Set up middleware
app.use((0, helmet_1.default)()); // Set security headers
app.use((0, compression_1.default)()); // Compress responses
app.use((0, morgan_1.default)('combined', { stream: logger_1.logStream })); // HTTP request logging
app.use(express_1.default.json({ limit: '10kb' })); // Parse JSON requests with size limit
app.use(express_1.default.urlencoded({ extended: true }));
// CORS configuration with multiple origin support
// src/app.ts - Ensure CORS is correctly configured
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) {
            return callback(null, true);
        }
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'https://storefront-virid.vercel.app',
            'http://localhost:4200',
        ];
        // Check if the origin is allowed
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('vercel.app')) {
            callback(null, true);
        }
        else {
            logger_1.default.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
// Apply rate limiting to auth routes
app.use(`${API_PREFIX}/auth`, limiter);
// Root endpoint
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to the E-commerce API',
        timestamp: new Date().toISOString(),
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to the storefront E-commerce API',
        documentation: '/api-docs',
    });
});
app.get('/debug/db', async (req, res) => {
    try {
        const isInitialized = data_source_1.default.isInitialized;
        if (isInitialized) {
            // Try a simple query
            const result = await data_source_1.default.query('SELECT 1 as connection_test');
            res.json({
                status: 'success',
                initialized: isInitialized,
                queryTest: result,
                config: {
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    database: process.env.DB_DATABASE,
                    hasUsername: !!process.env.DB_USERNAME,
                    hasPassword: !!process.env.DB_PASSWORD,
                },
            });
        }
        else {
            res.json({
                status: 'not_initialized',
                config: {
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    database: process.env.DB_DATABASE,
                    hasUsername: !!process.env.DB_USERNAME,
                    hasPassword: !!process.env.DB_PASSWORD,
                },
            });
        }
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
        });
    }
});
// Initialize routes
const routes_1 = __importDefault(require("./routes"));
app.use(API_PREFIX, routes_1.default);
// Handle 404 errors for API routes
app.all(`${API_PREFIX}/*`, (req, res) => {
    logger_1.default.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});
// Global error handling middleware
app.use(error_middleware_1.default);
exports.default = app;
