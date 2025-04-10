import TestDataSource from '../../config/test-database';
import { User } from '../../entities/user.entity';
import { Product } from '../../entities/product.entity';
import { Order } from '../../entities/order.entity';
import { OrderProduct } from '../../entities/order-product.entity';
import { Payment } from '../../entities/payment.entity';

// Initialize repositories that use the test database
export const testUserRepository = TestDataSource.getRepository(User);
export const testProductRepository = TestDataSource.getRepository(Product);
export const testOrderRepository = TestDataSource.getRepository(Order);
export const testOrderProductRepository = TestDataSource.getRepository(OrderProduct);
export const testPaymentRepository = TestDataSource.getRepository(Payment);
