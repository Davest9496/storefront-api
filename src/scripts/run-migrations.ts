import AppDataSource from '../config/database';
import logger from '../utils/logger';

async function runMigrations(): Promise<void> {
  try {
    // Initialize connection
    logger.info('Database connection initialized');
    logger.info('Database connection initialized');

    // Run migrations
    logger.info('Running migrations...');
    const migrations = await AppDataSource.runMigrations();

    if (migrations.length === 0) {
      logger.info('No migrations to run. Database is up to date.');
    } else {
      logger.info(`Successfully ran ${migrations.length} migrations:`);
      migrations.forEach((migration) => {
        logger.info(`- ${migration.name}`);
      });
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    // Close connection
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
