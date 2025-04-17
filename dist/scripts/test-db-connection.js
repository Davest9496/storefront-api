"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const user_entity_1 = require("../entities/user.entity");
const product_entity_1 = require("../entities/product.entity");
const order_entity_1 = require("../entities/order.entity");
const logger_1 = __importDefault(require("../utils/logger"));
async function testDatabaseConnection() {
    try {
        // Initialize connection
        logger_1.default.info('Attempting to connect to database...');
        await database_1.default.initialize();
        logger_1.default.info('✅ Database connection established successfully');
        // Test entity queries
        logger_1.default.info('Testing entity queries...');
        // Test User entity
        const userCount = await database_1.default.manager.count(user_entity_1.User);
        logger_1.default.info(`Found ${userCount} users in the database`);
        // Test Product entity
        const productCount = await database_1.default.manager.count(product_entity_1.Product);
        logger_1.default.info(`Found ${productCount} products in the database`);
        // Test Product isNew calculation
        const newProducts = await database_1.default.manager
            .createQueryBuilder(product_entity_1.Product, 'product')
            .where('product.is_new = :isNew', { isNew: true })
            .getMany();
        logger_1.default.info(`Found ${newProducts.length} new products in the database`);
        // Test Order entity with relations
        const orders = await database_1.default.manager
            .createQueryBuilder(order_entity_1.Order, 'order')
            .leftJoinAndSelect('order.orderProducts', 'orderProducts')
            .leftJoinAndSelect('orderProducts.product', 'product')
            .getMany();
        logger_1.default.info(`Found ${orders.length} orders in the database`);
        if (orders.length > 0) {
            const firstOrder = orders[0];
            logger_1.default.info(`First order ID: ${firstOrder.id}`);
            logger_1.default.info(`Order items: ${firstOrder.orderProducts?.length || 0}`);
            if (firstOrder.orderProducts && firstOrder.orderProducts.length > 0) {
                const item = firstOrder.orderProducts[0];
                logger_1.default.info(`First order item: ${item.quantity}x ${item.product?.productName || 'Unknown product'}`);
            }
        }
        logger_1.default.info('✅ All entity queries completed successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Error during database test:', error);
    }
    finally {
        // Close connection
        if (database_1.default.isInitialized) {
            await database_1.default.destroy();
            logger_1.default.info('Database connection closed');
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
