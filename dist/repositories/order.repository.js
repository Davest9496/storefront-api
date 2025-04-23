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
    async findOrdersByUserId(userId) {
        return this.find({
            where: { userId },
            relations: ['orderProducts', 'orderProducts.product'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOrdersByStatus(status) {
        return this.find({
            where: { status },
            relations: ['orderProducts', 'orderProducts.product', 'user', 'payment'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOrdersWithinDateRange(startDate, endDate) {
        return this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderProducts', 'orderProducts')
            .leftJoinAndSelect('orderProducts.product', 'product')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.payment', 'payment')
            .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('order.createdAt', 'DESC')
            .getMany();
    }
    async findRecentOrders(limit = 10) {
        return this.find({
            relations: ['orderProducts', 'orderProducts.product', 'user', 'payment'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getOrderCount() {
        return this.count();
    }
    async getOrderCountByStatus(status) {
        return this.count({
            where: { status },
        });
    }
    // Find orders with pagination
    async findOrdersWithPagination(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderProducts', 'orderProducts')
            .leftJoinAndSelect('orderProducts.product', 'product')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.payment', 'payment');
        if (status) {
            queryBuilder.where('order.status = :status', { status });
        }
        const [orders, total] = await queryBuilder
            .orderBy('order.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const pages = Math.ceil(total / limit);
        return { orders, total, pages };
    }
}
exports.OrderRepository = OrderRepository;
// Export a singleton instance
exports.orderRepository = new OrderRepository();
