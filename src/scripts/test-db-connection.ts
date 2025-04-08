import AppDataSource from '../config/database';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import logger from '../utils/logger';

async function testDatabaseConnection(): Promise<void> {
  try {
    // Initialize connection
    logger.info('Attempting to connect to database...');
    await AppDataSource.initialize();
    logger.info('✅ Database connection established successfully');

    // Test entity queries
    logger.info('Testing entity queries...');

    // Test User entity
    const userCount = await AppDataSource.manager.count(User);
    logger.info(`Found ${userCount} users in the database`);

    // Test Product entity
    const productCount = await AppDataSource.manager.count(Product);
    logger.info(`Found ${productCount} products in the database`);

    // Test Product isNew calculation
    const newProducts = await AppDataSource.manager
      .createQueryBuilder(Product, 'product')
      .where('product.is_new = :isNew', { isNew: true })
      .getMany();

    logger.info(`Found ${newProducts.length} new products in the database`);

    // Test Order entity with relations
    const orders = await AppDataSource.manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product')
      .getMany();

    logger.info(`Found ${orders.length} orders in the database`);

    if (orders.length > 0) {
      const firstOrder = orders[0];
      logger.info(`First order ID: ${firstOrder.id}`);
      logger.info(`Order items: ${firstOrder.orderProducts?.length || 0}`);

      if (firstOrder.orderProducts && firstOrder.orderProducts.length > 0) {
        const item = firstOrder.orderProducts[0];
        logger.info(
          `First order item: ${item.quantity}x ${item.product?.productName || 'Unknown product'}`,
        );
      }
    }

    logger.info('✅ All entity queries completed successfully');
  } catch (error) {
    logger.error('❌ Error during database test:', error);
  } finally {
    // Close connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
