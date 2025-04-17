"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
const database_1 = __importDefault(require("../config/database"));
class ProductRepository extends typeorm_1.Repository {
    constructor() {
        super(product_entity_1.Product, database_1.default.manager);
    }
    async findByCategory(category) {
        return this.find({
            where: { category },
            order: { productName: 'ASC' },
        });
    }
    async findNewProducts() {
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
exports.ProductRepository = ProductRepository;
// Export a singleton instance
exports.productRepository = new ProductRepository();
