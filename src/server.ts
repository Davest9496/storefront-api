import { config } from 'dotenv';
import app from './app';
import logger from './utils/logger';
import { initializeDatabase } from './config/data-source';

// Load environment variables
config();

// Set server port
const PORT = process.env.PORT || 3000;

// Start server function
async function startServer() {
  try {
    // Initialize database connection with retry capability
    await initializeDatabase(5, 3000); // 5 retries, 3 second delay between retries

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`,
      );
      logger.info(`API available at http://localhost:${PORT}/api`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        const AppDataSource = (await import('./config/data-source')).default;
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
        }

        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        const AppDataSource = (await import('./config/data-source')).default;
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
        }

        process.exit(0);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Uncaught server error:', error);
    process.exit(1);
  });
}

export default startServer;
