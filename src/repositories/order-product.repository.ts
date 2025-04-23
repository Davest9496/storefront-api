import { Repository } from 'typeorm';
import { OrderProduct } from '../entities/order-product.entity';
import AppDataSource from '../config/database';

export class OrderProductRepository extends Repository<OrderProduct> {
  constructor() {
    super(OrderProduct, AppDataSource.manager);
  }

  async findByOrderId(orderId: number): Promise<OrderProduct[]> {
    return this.find({
      where: { orderId },
      relations: ['product'],
      order: { id: 'ASC' },
    });
  }

  async findByProductId(productId: string): Promise<OrderProduct[]> {
    return this.find({
      where: { productId },
      relations: ['order'],
      order: { id: 'ASC' },
    });
  }

  async findByOrderAndProduct(orderId: number, productId: string): Promise<OrderProduct | null> {
    return this.findOne({
      where: { orderId, productId },
    });
  }

  async findByIdAndOrderId(id: number, orderId: number): Promise<OrderProduct | null> {
    return this.findOne({
      where: { id, orderId },
    });
  }
}

// Export a singleton instance
export const orderProductRepository = new OrderProductRepository();
