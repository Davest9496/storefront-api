import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus, PaymentProvider } from '../types/enums';
import AppDataSource from '../config/database';

export class PaymentRepository extends Repository<Payment> {
  constructor() {
    super(Payment, AppDataSource.manager);
  }

  async findByOrderId(orderId: number): Promise<Payment | null> {
    return this.findOne({
      where: { orderId },
      relations: ['order'],
    });
  }

  async findByProviderTransactionId(providerTransactionId: string): Promise<Payment | null> {
    return this.findOne({
      where: { providerTransactionId },
    });
  }

  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.find({
      where: { status },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentsByProvider(provider: PaymentProvider): Promise<Payment[]> {
    return this.find({
      where: { provider },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }
}

// Export a singleton instance
export const paymentRepository = new PaymentRepository();
