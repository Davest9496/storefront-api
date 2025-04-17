"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const product_repository_1 = require("../repositories/product.repository");
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
class ProductService {
    constructor() {
        // Initialize S3 client
        this.s3Client = new client_s3_1.S3Client({
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
    async getAllProducts() {
        return product_repository_1.productRepository.find({
            order: {
                productName: 'ASC',
            },
        });
    }
    /**
     * Get product by ID
     */
    async getProductById(id) {
        return product_repository_1.productRepository.findOne({
            where: { id },
        });
    }
    /**
     * Get products by category
     */
    async getProductsByCategory(category) {
        return product_repository_1.productRepository.findByCategory(category);
    }
    /**
     * Create a new product
     */
    async createProduct(productData) {
        const product = product_repository_1.productRepository.create(productData);
        return product_repository_1.productRepository.save(product);
    }
    /**
     * Update a product
     */
    async updateProduct(id, productData) {
        const product = await product_repository_1.productRepository.findOne({
            where: { id },
        });
        if (!product) {
            return null;
        }
        // Merge product with updated data
        Object.assign(product, productData);
        return product_repository_1.productRepository.save(product);
    }
    /**
     * Delete a product
     */
    async deleteProduct(id) {
        const result = await product_repository_1.productRepository.delete(id);
        return result.affected !== null && result.affected !== undefined && result.affected > 0;
    }
    /**
     * Upload product image to S3
     */
    async uploadProductImage(productId, fileBuffer, mimeType) {
        try {
            // Generate unique filename
            const extension = this.getFileExtensionFromMimeType(mimeType);
            const filename = `products/${productId}/${(0, uuid_1.v4)()}.${extension}`;
            // Upload to S3
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: filename,
                Body: fileBuffer,
                ContentType: mimeType,
                ACL: 'public-read',
            });
            await this.s3Client.send(command);
            // Return the URL of the uploaded image
            return `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
        }
        catch (error) {
            logger_1.default.error('Error uploading to S3:', error);
            throw new Error('Failed to upload image to S3');
        }
    }
    /**
     * Get file extension from MIME type
     */
    getFileExtensionFromMimeType(mimeType) {
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
    async getFeaturedProducts() {
        return product_repository_1.productRepository.findNewProducts();
    }
}
exports.productService = new ProductService();
