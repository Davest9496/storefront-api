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

  async findOrdersByUserId(userId: number): Promise<Order[]> {
    return this.find({
      where: { userId },
      relations: ['orderProducts', 'orderProducts.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.find({
      where: { status },
      relations: ['orderProducts', 'orderProducts.product', 'user', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrdersWithinDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return this.createQueryBuilder('order')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async findRecentOrders(limit: number = 10): Promise<Order[]> {
    return this.find({
      relations: ['orderProducts', 'orderProducts.product', 'user', 'payment'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getOrderCount(): Promise<number> {
    return this.count();
  }

  async getOrderCountByStatus(status: OrderStatus): Promise<number> {
    return this.count({
      where: { status },
    });
  }

  // Find orders with pagination
  async findOrdersWithPagination(
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder('order')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.payment', 'payment');

    if (status) {
      queryBuilder.where('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const pages = Math.ceil(total / limit);

    return { orders, total, pages };
  }
}

// Export a singleton instance
export const orderRepository = new OrderRepository();
