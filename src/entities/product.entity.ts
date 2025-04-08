import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
  BeforeInsert,
} from 'typeorm';
import { ProductCategory } from '../types/enums';
import { OrderProduct } from './order-product.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryColumn({ length: 50 })
  id!: string;

  @Column({ name: 'product_name', length: 100 })
  productName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Index('idx_products_category')
  @Column({
    type: 'enum',
    enum: ProductCategory,
  })
  category!: ProductCategory;

  @Column({ name: 'product_desc', length: 250, nullable: true })
  productDesc!: string;

  @Column({ name: 'image_name', length: 255 })
  imageName!: string;

  @Column({ name: 'product_features', type: 'text', array: true, nullable: true })
  productFeatures!: string[];

  @Column({ name: 'product_accessories', type: 'text', array: true, nullable: true })
  productAccessories!: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Virtual property to calculate if the product is new (less than 30 days old)
  @Column({ name: 'is_new', type: 'boolean', default: true })
  isNew!: boolean;

  // Relations
  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.product)
  orderProducts?: OrderProduct[];

  // Calculate is_new based on createdAt date - this happens after loading from DB
  @AfterLoad()
  updateIsNew(): void {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.isNew = this.createdAt > thirtyDaysAgo;
  }

  // Set isNew to true for new products by default
  @BeforeInsert()
  setIsNewOnInsert(): void {
    this.isNew = true;
  }
}
