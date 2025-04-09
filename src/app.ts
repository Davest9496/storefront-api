import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import logger, { logStream } from './utils/logger';

// Load environment variables
config();

// Import middleware
import errorMiddleware from './middleware/error.middleware';

// Create Express app
const app = express();

// Define API prefix
const API_PREFIX = process.env.API_PREFIX || '/api';

// Set up middleware
app.use(helmet()); // Set security headers
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: logStream })); // HTTP request logging
app.use(express.json({ limit: '10kb' })); // Parse JSON requests with size limit
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*', // Allow requests from the frontend URL
    credentials: true, // Allow cookies
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiting to auth routes
app.use(`${API_PREFIX}/auth`, limiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the E-commerce API',
    documentation: '/api-docs',
  });
});

// Initialize routes
import routes from './routes';
app.use(API_PREFIX, routes);

// Handle 404 errors for API routes
app.all(`${API_PREFIX}/*`, (req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use(errorMiddleware);

export default app;
