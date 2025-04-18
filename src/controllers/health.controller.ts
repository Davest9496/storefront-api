import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import logger from '../utils/logger';

/**
 * @desc    Health check endpoint
 * @route   GET /health
 * @access  Public
 */
// In src/controllers/health.controller.ts
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthcheck = {
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      path: req.path,
      dbConnected: AppDataSource.isInitialized,
    };

    // Check database connection
    if (AppDataSource.isInitialized) {
      try {
        // Run a simple query to verify the connection is working
        await AppDataSource.query('SELECT 1');
        healthcheck.dbConnected = true;
      } catch (dbError) {
        logger.error('Database ping failed despite initialized connection:', dbError);
        healthcheck.dbConnected = false;
      }
    }

    logger.info(`Health check successful: ${JSON.stringify(healthcheck)}`);
    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      dbConnected: false,
    });
  }
};
