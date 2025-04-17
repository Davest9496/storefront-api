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
// Load environment variables
(0, dotenv_1.config)();
// Import middleware
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
// Create Express app
const app = (0, express_1.default)();
// Define API prefix
const API_PREFIX = process.env.API_PREFIX || '/api';
// Set up middleware
app.use((0, helmet_1.default)()); // Set security headers
app.use((0, compression_1.default)()); // Compress responses
app.use((0, morgan_1.default)('combined', { stream: logger_1.logStream })); // HTTP request logging
app.use(express_1.default.json({ limit: '10kb' })); // Parse JSON requests with size limit
app.use(express_1.default.urlencoded({ extended: true }));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*', // Allow requests from the frontend URL
    credentials: true, // Allow cookies
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
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to the E-commerce API',
        documentation: '/api-docs',
    });
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
