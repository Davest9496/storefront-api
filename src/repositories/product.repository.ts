import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductCategory } from '../types/enums';
import AppDataSource from '../config/database';

export class ProductRepository extends Repository<Product> {
  constructor() {
    super(Product, AppDataSource.manager);
  }

  async findByCategory(category: ProductCategory): Promise<Product[]> {
    return this.find({
      where: { category },
      order: { productName: 'ASC' },
    });
  }

  async findNewProducts(): Promise<Product[]> {
    // Get products and calculate isNew based on createdAt date
    const products = await this.find({
      order: { createdAt: 'DESC' },
    });

    // Filter products to only show those that are new (less than 30 days old)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return products.filter((product) => product.createdAt > thirtyDaysAgo);
  }
}

// Export a singleton instance
export const productRepository = new ProductRepository();
