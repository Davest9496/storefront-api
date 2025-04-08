import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity({ name: 'order_products' })
export class OrderProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_order_products_order_id')
  @Column({ name: 'order_id' })
  orderId!: number;

  @Index('idx_order_products_product_id')
  @Column({ name: 'product_id', length: 50 })
  productId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.orderProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, (product) => product.orderProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
