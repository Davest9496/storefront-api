import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { OrderStatus } from '../types/enums';
import { User } from './user.entity';
import { OrderProduct } from './order-product.entity';
import { Payment } from './payment.entity';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_orders_user_id')
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.ACTIVE,
  })
  status!: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, { cascade: true })
  orderProducts?: OrderProduct[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment?: Payment;
}
