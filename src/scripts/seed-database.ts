import AppDataSource from '../config/database';
import logger from '../utils/logger';

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection has been established successfully.');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection has been closed.');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Get active database connection
 */
export const getConnection = (): typeof AppDataSource => {
  if (!AppDataSource.isInitialized) {
    throw new Error(
      'Database connection has not been initialized. Call initializeDatabase() first.',
    );
  }
  return AppDataSource;
};

export default {
  initializeDatabase,
  closeDatabase,
  getConnection,
};
