import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import logger from '../utils/logger';

/**
 * @desc    Health check endpoint
 * @route   GET /health
 * @access  Public
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      database: 'Disconnected',
    };

    // Check database connection
    if (AppDataSource.isInitialized) {
      healthcheck.database = 'Connected';
    }

    logger.info(`Health check successful: ${JSON.stringify(healthcheck)}`);
    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      uptime: process.uptime(),
      message: 'Service Unavailable',
      timestamp: Date.now(),
    });
  }
};
