import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import logger, { logStream } from './utils/logger';
import AppDataSource from './config/data-source';

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

// CORS configuration with multiple origin support
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'https://storefront-virid.vercel.app',
        'http://localhost:4200',
      ];
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
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

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the E-commerce API',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the storefront E-commerce API',
    documentation: '/api-docs',
  });
});

app.get('/debug/db', async (req, res) => {
  try {
    const isInitialized = AppDataSource.isInitialized;

    if (isInitialized) {
      // Try a simple query
      const result = await AppDataSource.query('SELECT 1 as connection_test');

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
    } else {
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
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      stack:
        process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    });
  }
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
