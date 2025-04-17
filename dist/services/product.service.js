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
const database_1 = __importDefault(require("../config/database"));
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
        // Create fallback products data
        // Updated fallback products array for your ProductService class
        this.fallbackProducts = [
            {
                id: 'xx59',
                productName: 'XX59 Headphones',
                price: 129.99,
                category: 'headphones',
                productDesc: 'Enjoy your audio almost anywhere and customize it to your specific tastes with the XX59 headphones. The stylish yet durable versatile wireless headset is a brilliant companion at home or on the move.',
                imageName: 'product-xx59-headphones',
                productFeatures: [
                    'The XX59 headphones offer a sleek design and a comfortable fit. They provide a balanced sound profile with deep bass and clear highs, making them suitable for a wide range of music genres.',
                    'With a long battery life and Bluetooth connectivity, the XX59 headphones are perfect for on-the-go listening. They also come with a built-in microphone for hands-free calls.',
                ],
                productAccessories: [
                    '{"quantity": 1, "item": "Headphone Unit"}',
                    '{"quantity": 1, "item": "User Manual"}',
                    '{"quantity": 1, "item": "3.5mm Audio Cable"}',
                    '{"quantity": 1, "item": "Charging Cable"}',
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                isNew: true,
            },
            {
                id: 'xx99-mark-one',
                productName: 'XX99 Mark I Headphones',
                price: 179.99,
                category: 'headphones',
                productDesc: 'As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction for audiophiles, mixing engineers, and music aficionados alike in studios and on the go.',
                imageName: 'product-xx99-mark-one-headphones',
                productFeatures: [
                    'The XX99 Mark I headphones offer a comfortable fit with their padded headband and earcups. They provide excellent sound isolation and a balanced sound profile, making them ideal for both casual listening and professional use.',
                    'With a durable build and a detachable cable, the XX99 Mark I headphones are designed to last. They come with a carrying case for easy transport and storage.',
                ],
                productAccessories: [
                    '{"quantity": 1, "item": "Headphone Unit"}',
                    '{"quantity": 1, "item": "Replacement Earcups"}',
                    '{"quantity": 1, "item": "User Manual"}',
                    '{"quantity": 1, "item": "3.5mm Audio Cable"}',
                    '{"quantity": 1, "item": "Carrying Case"}',
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                isNew: true,
            },
            {
                id: 'xx99-mark-two',
                productName: 'XX99 Mark II Headphones',
                price: 299.99,
                category: 'headphones',
                productDesc: 'The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience by reproducing the balanced depth and precision of studio-quality sound.',
                imageName: 'product-xx99-mark-two-headphones',
                productFeatures: [
                    'Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for those who like to enjoy endless listening. It includes intuitive controls designed for any situation. Whether you are taking a business call or just in your own personal space, the auto on/off and pause features ensure that you will never miss a beat.',
                    'The advanced Active Noise Cancellation with built-in equalizer allow you to experience your audio world on your terms. It lets you enjoy your audio in peace, but quickly interact with your surroundings when you need to. Combined with Bluetooth 5.0 compliant connectivity and 17 hour battery life, the XX99 Mark II headphones gives you superior sound, cutting-edge technology, and a modern design aesthetic.',
                ],
                productAccessories: [
                    '{"quantity": 1, "item": "Headphone Unit"}',
                    '{"quantity": 2, "item": "Replacement Earcups"}',
                    '{"quantity": 1, "item": "User Manual"}',
                    '{"quantity": 1, "item": "3.5mm 5mm Audio Cable"}',
                    '{"quantity": 1, "item": "Travel Bag"}',
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                isNew: true,
            },
            {
                id: 'yx1',
                productName: 'YX1 Wireless Earphones',
                price: 149.99,
                category: 'earphones',
                productDesc: 'Tailor your listening experience with bespoke dynamic drivers from the new YX1 Wireless Earphones. Enjoy incredible high-fidelity sound even in noisy environments with its active noise cancellation feature.',
                imageName: 'product-yx1-earphones',
                productFeatures: [
                    'The YX1 wireless earphones offer a comfortable and secure fit with their ergonomic design and multiple ear tip sizes. They provide high-fidelity sound with deep bass and clear highs, making them perfect for music lovers.',
                    'With active noise cancellation and a long battery life, the YX1 earphones let you enjoy your music without distractions. They also come with a charging case for convenient on-the-go charging.',
                ],
                productAccessories: [
                    '{"quantity": 1, "item": "Earphone Unit"}',
                    '{"quantity": 3, "item": "Ear Tip Sizes"}',
                    '{"quantity": 1, "item": "User Manual"}',
                    '{"quantity": 1, "item": "Charging Case"}',
                    '{"quantity": 1, "item": "USB-C Charging Cable"}',
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                isNew: true,
            },
            {
                id: 'zx7',
                productName: 'ZX7 Speaker',
                price: 349.99,
                category: 'speakers',
                productDesc: 'Stream high quality sound wirelessly with minimal loss. The ZX7 bookshelf speaker uses high-end audiophile components that represents the top of the line powered speakers for home or studio use.',
                imageName: 'product-zx7-speakers',
                productFeatures: [
                    'The ZX7 speaker delivers exceptional sound quality with its high-performance drivers and advanced crossover network. It supports both wired and wireless connections, giving you flexibility in your audio setup.',
                    "With a classic design and premium build quality, the ZX7 speaker is a great addition to any audio enthusiast's collection. It also includes a remote control for easy operation.",
                ],
                productAccessories: [
                    '{"quantity": 2, "item": "Speaker Units"}',
                    '{"quantity": 1, "item": "Remote Control"}',
                    '{"quantity": 1, "item": "User Manual"}',
                    '{"quantity": 1, "item": "Power Cable"}',
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                isNew: true,
            },
            {
                id: 'zx9',
                productName: 'ZX9 Speaker',
                price: 449.99,
                category: 'speakers',
                productDesc: "Upgrade your sound system with the all new ZX9 active speaker. It's a bookshelf speaker system that offers truly wireless connectivity -- creating new possibilities for more pleasing and practical audio setups.",
                imageName: 'product-zx9-speakers',
                productFeatures: [
                    'The ZX9 speaker offers a powerful sound experience with its high-fidelity drivers and advanced acoustic design. It supports wireless connectivity, allowing you to stream music from your devices with ease.',
                    'With a sleek and modern design, the ZX9 speaker fits seamlessly into any home decor. It also includes a remote control for convenient operation.',
                ],
                productAccessories: [
                    '{"quantity": 2, "item": "Speaker Units"}',
                    '{"quantity": 1, "item": "Remote Control"}',
                    '{"quantity": 1, "item": "User Manual"}',
                    '{"quantity": 1, "item": "Power Cable"}',
                    '{"quantity": 2, "item": "Speaker Stands"}',
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                isNew: true,
            },
        ];
    }
    /**
     * Get all products
     */
    async getAllProducts() {
        try {
            // Check if database is connected
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, using fallback products');
                return this.fallbackProducts;
            }
            return await product_repository_1.productRepository.find({
                order: {
                    productName: 'ASC',
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting products from database:', error);
            return this.fallbackProducts;
        }
    }
    /**
     * Get product by ID
     */
    async getProductById(id) {
        try {
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, using fallback products');
                return this.fallbackProducts.find((p) => p.id === id) || null;
            }
            return await product_repository_1.productRepository.findOne({
                where: { id },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting product by ID from database:', error);
            return this.fallbackProducts.find((p) => p.id === id) || null;
        }
    }
    /**
     * Get products by category
     */
    async getProductsByCategory(category) {
        try {
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, using fallback products');
                return this.fallbackProducts.filter((p) => p.category === category);
            }
            return await product_repository_1.productRepository.findByCategory(category);
        }
        catch (error) {
            logger_1.default.error('Error getting products by category from database:', error);
            return this.fallbackProducts.filter((p) => p.category === category);
        }
    }
    /**
     * Create a new product
     */
    async createProduct(productData) {
        try {
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, cannot create product');
                throw new Error('Database not connected');
            }
            const product = product_repository_1.productRepository.create(productData);
            return await product_repository_1.productRepository.save(product);
        }
        catch (error) {
            logger_1.default.error('Error creating product:', error);
            throw error;
        }
    }
    /**
     * Update a product
     */
    async updateProduct(id, productData) {
        try {
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, cannot update product');
                const product = this.fallbackProducts.find((p) => p.id === id);
                if (!product)
                    return null;
                // Create a simulation of update for fallback data
                return {
                    ...product,
                    ...productData,
                    updatedAt: new Date(),
                };
            }
            const product = await product_repository_1.productRepository.findOne({
                where: { id },
            });
            if (!product) {
                return null;
            }
            // Merge product with updated data
            Object.assign(product, productData);
            return await product_repository_1.productRepository.save(product);
        }
        catch (error) {
            logger_1.default.error('Error updating product:', error);
            throw error;
        }
    }
    /**
     * Delete a product
     */
    async deleteProduct(id) {
        try {
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, cannot delete product');
                throw new Error('Database not connected');
            }
            const result = await product_repository_1.productRepository.delete(id);
            return result.affected !== null && result.affected !== undefined && result.affected > 0;
        }
        catch (error) {
            logger_1.default.error('Error deleting product:', error);
            throw error;
        }
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
        try {
            if (!database_1.default.isInitialized) {
                logger_1.default.warn('Database not connected, using fallback products');
                return this.fallbackProducts.filter((p) => p.isNew);
            }
            return await product_repository_1.productRepository.findNewProducts();
        }
        catch (error) {
            logger_1.default.error('Error getting featured products:', error);
            return this.fallbackProducts.filter((p) => p.isNew);
        }
    }
}
exports.productService = new ProductService();
