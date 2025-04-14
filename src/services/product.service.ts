import { productRepository } from '../repositories/product.repository';
import { Product } from '../entities/product.entity';
import { ProductCategory } from '../types/enums';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

class ProductService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.bucketName = process.env.S3_BUCKET || 'storefront-images-058264347310';
  }

  /**
   * Get all products
   */
  async getAllProducts(): Promise<Product[]> {
    return productRepository.find({
      order: {
        productName: 'ASC',
      },
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    return productRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    return productRepository.findByCategory(category);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const product = productRepository.create(productData);
    return productRepository.save(product);
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    const product = await productRepository.findOne({
      where: { id },
    });

    if (!product) {
      return null;
    }

    // Merge product with updated data
    Object.assign(product, productData);

    return productRepository.save(product);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<boolean> {
    const result = await productRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  /**
   * Upload product image to S3
   */
  async uploadProductImage(
    productId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      // Generate unique filename
      const extension = this.getFileExtensionFromMimeType(mimeType);
      const filename = `products/${productId}/${uuidv4()}.${extension}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      // Return the URL of the uploaded image
      return `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  }

  /**
   * Get featured/new products
   */
  async getFeaturedProducts(): Promise<Product[]> {
    return productRepository.findNewProducts();
  }
}

export const productService = new ProductService();
