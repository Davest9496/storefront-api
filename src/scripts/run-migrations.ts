import AppDataSource from '../config/database';
import logger from '../utils/logger';

async function runMigrations(): Promise<void> {
  try {
    // Initialize DataSource
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    logger.info('Database connection initialized successfully');

    // Run migrations
    logger.info('Running migrations...');
    const migrations = await AppDataSource.runMigrations({ transaction: 'all' });

    if (migrations.length === 0) {
      logger.info('No migrations to run. Database is up to date.');
    } else {
      logger.info(`Successfully ran ${migrations.length} migrations:`);
      migrations.forEach((migration) => {
        logger.info(`- ${migration.name}`);
      });
    }
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  } finally {
    // Close connection if it was initialized
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default runMigrations;
