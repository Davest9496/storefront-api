"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderProductRepository = exports.OrderProductRepository = void 0;
const typeorm_1 = require("typeorm");
const order_product_entity_1 = require("../entities/order-product.entity");
const database_1 = __importDefault(require("../config/database"));
class OrderProductRepository extends typeorm_1.Repository {
    constructor() {
        super(order_product_entity_1.OrderProduct, database_1.default.manager);
    }
    async findByOrderId(orderId) {
        return this.find({
            where: { orderId },
            relations: ['product'],
            order: { id: 'ASC' },
        });
    }
    async findByProductId(productId) {
        return this.find({
            where: { productId },
            relations: ['order'],
            order: { id: 'ASC' },
        });
    }
    async findByOrderAndProduct(orderId, productId) {
        return this.findOne({
            where: { orderId, productId },
        });
    }
    async findByIdAndOrderId(id, orderId) {
        return this.findOne({
            where: { id, orderId },
        });
    }
}
exports.OrderProductRepository = OrderProductRepository;
// Export a singleton instance
exports.orderProductRepository = new OrderProductRepository();
