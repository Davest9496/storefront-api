"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = exports.OrderRepository = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../entities/order.entity");
const enums_1 = require("../types/enums");
const database_1 = __importDefault(require("../config/database"));
class OrderRepository extends typeorm_1.Repository {
    constructor() {
        super(order_entity_1.Order, database_1.default.manager);
    }
    async findUserActiveOrder(userId) {
        return this.findOne({
            where: {
                userId,
                status: enums_1.OrderStatus.ACTIVE,
            },
            relations: ['orderProducts', 'orderProducts.product'],
        });
    }
    async findUserCompletedOrders(userId) {
        return this.find({
            where: {
                userId,
                status: enums_1.OrderStatus.COMPLETE,
            },
            relations: ['orderProducts', 'orderProducts.product', 'payment'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOrderWithDetails(orderId) {
        return this.findOne({
            where: { id: orderId },
            relations: ['orderProducts', 'orderProducts.product', 'payment', 'user'],
        });
    }
}
exports.OrderRepository = OrderRepository;
// Export a singleton instance
exports.orderRepository = new OrderRepository();
