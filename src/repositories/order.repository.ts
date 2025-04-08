import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../types/enums';
import AppDataSource from '../config/database';

export class OrderRepository extends Repository<Order> {
  constructor() {
    super(Order, AppDataSource.manager);
  }

  async findUserActiveOrder(userId: number): Promise<Order | null> {
    return this.findOne({
      where: {
        userId,
        status: OrderStatus.ACTIVE,
      },
      relations: ['orderProducts', 'orderProducts.product'],
    });
  }

  async findUserCompletedOrders(userId: number): Promise<Order[]> {
    return this.find({
      where: {
        userId,
        status: OrderStatus.COMPLETE,
      },
      relations: ['orderProducts', 'orderProducts.product', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrderWithDetails(orderId: number): Promise<Order | null> {
    return this.findOne({
      where: { id: orderId },
      relations: ['orderProducts', 'orderProducts.product', 'payment', 'user'],
    });
  }
}

// Export a singleton instance
export const orderRepository = new OrderRepository();
