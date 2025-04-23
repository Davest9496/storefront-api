"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusById = exports.removeItemFromOrder = exports.updateOrderItemQuantity = exports.addItemToExistingOrder = exports.createNewOrder = exports.calculateOrderTotal = void 0;
const order_entity_1 = require("../entities/order.entity");
const order_product_entity_1 = require("../entities/order-product.entity");
const enums_1 = require("../types/enums");
const error_middleware_1 = require("../middleware/error.middleware");
const product_repository_1 = require("../repositories/product.repository");
const order_repository_1 = require("../repositories/order.repository");
const database_1 = __importDefault(require("../config/database"));
/**
 * Calculate order total based on products and quantities
 */
const calculateOrderTotal = async (items) => {
    let total = 0;
    // Get all products in a single query
    const productIds = items.map((item) => item.productId);
    const products = await product_repository_1.productRepository.findByIds(productIds);
    // Calculate total
    for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
            throw new error_middleware_1.AppError(`Product with ID ${item.productId} not found`, 404);
        }
        total += product.price * item.quantity;
    }
    return total;
};
exports.calculateOrderTotal = calculateOrderTotal;
/**
 * Create a new order
 */
const createNewOrder = async (userId, items, _shippingAddress) => {
    // Start a transaction
    return database_1.default.transaction(async (transactionalEntityManager) => {
        // Check if user already has an active order
        const existingActiveOrder = await order_repository_1.orderRepository.findUserActiveOrder(userId);
        if (existingActiveOrder) {
            throw new error_middleware_1.AppError('You already have an active order', 400);
        }
        // Validate that products exist and have enough inventory
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new error_middleware_1.AppError('Order must contain at least one product', 400);
        }
        // Get all products in a single query
        const productIds = items.map((item) => item.productId);
        const products = await product_repository_1.productRepository.findByIds(productIds);
        // Check if all products exist
        if (products.length !== productIds.length) {
            throw new error_middleware_1.AppError('One or more products not found', 404);
        }
        // Create new order
        const order = order_repository_1.orderRepository.create({
            userId,
            status: enums_1.OrderStatus.ACTIVE,
        });
        // Save the order to get its ID
        const savedOrder = await transactionalEntityManager.save(order);
        // Create order items
        const orderItems = [];
        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new error_middleware_1.AppError(`Product with ID ${item.productId} not found`, 404);
            }
            const orderItem = new order_product_entity_1.OrderProduct();
            orderItem.orderId = savedOrder.id;
            orderItem.productId = product.id;
            orderItem.quantity = item.quantity;
            orderItems.push(orderItem);
        }
        // Save order items
        await transactionalEntityManager.save(orderItems);
        // Get the complete order with items
        const completeOrder = await transactionalEntityManager.findOne(order_entity_1.Order, {
            where: { id: savedOrder.id },
            relations: ['orderProducts', 'orderProducts.product', 'user'],
        });
        if (!completeOrder) {
            throw new error_middleware_1.AppError('Error retrieving created order', 500);
        }
        return completeOrder;
    });
};
exports.createNewOrder = createNewOrder;
/**
 * Add item to an existing order
 */
const addItemToExistingOrder = async (userId, orderId, productId, quantity) => {
    // Get the order
    const order = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    if (!order) {
        throw new error_middleware_1.AppError('Order not found', 404);
    }
    // Ensure the order belongs to the authenticated user
    if (order.userId !== userId) {
        throw new error_middleware_1.AppError('Not authorized to access this order', 403);
    }
    // Ensure the order is active
    if (order.status !== enums_1.OrderStatus.ACTIVE) {
        throw new error_middleware_1.AppError('Cannot modify a completed order', 400);
    }
    // Check if the product exists
    const product = await product_repository_1.productRepository.findOne({ where: { id: productId } });
    if (!product) {
        throw new error_middleware_1.AppError('Product not found', 404);
    }
    // Check if the product is already in the order
    const existingItem = order.orderProducts?.find((item) => item.productId === productId);
    if (existingItem) {
        // Update quantity instead of adding a new item
        existingItem.quantity += quantity;
        await database_1.default.getRepository(order_product_entity_1.OrderProduct).save(existingItem);
    }
    else {
        // Create new order item
        const orderItem = new order_product_entity_1.OrderProduct();
        orderItem.orderId = orderId;
        orderItem.productId = productId;
        orderItem.quantity = quantity;
        await database_1.default.getRepository(order_product_entity_1.OrderProduct).save(orderItem);
    }
    // Get the updated order
    const updatedOrder = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    if (!updatedOrder) {
        throw new error_middleware_1.AppError('Error retrieving updated order', 500);
    }
    return updatedOrder;
};
exports.addItemToExistingOrder = addItemToExistingOrder;
/**
 * Update order item quantity
 */
const updateOrderItemQuantity = async (userId, orderId, itemId, quantity) => {
    // Get the order
    const order = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    if (!order) {
        throw new error_middleware_1.AppError('Order not found', 404);
    }
    // Ensure the order belongs to the authenticated user
    if (order.userId !== userId) {
        throw new error_middleware_1.AppError('Not authorized to access this order', 403);
    }
    // Ensure the order is active
    if (order.status !== enums_1.OrderStatus.ACTIVE) {
        throw new error_middleware_1.AppError('Cannot modify a completed order', 400);
    }
    // Find the order item
    const orderItem = await database_1.default.getRepository(order_product_entity_1.OrderProduct).findOne({
        where: { id: itemId, orderId },
    });
    if (!orderItem) {
        throw new error_middleware_1.AppError('Order item not found', 404);
    }
    // Update quantity
    orderItem.quantity = quantity;
    // Save updated item
    await database_1.default.getRepository(order_product_entity_1.OrderProduct).save(orderItem);
    // Get the updated order
    const updatedOrder = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    if (!updatedOrder) {
        throw new error_middleware_1.AppError('Error retrieving updated order', 500);
    }
    return updatedOrder;
};
exports.updateOrderItemQuantity = updateOrderItemQuantity;
/**
 * Remove item from order
 */
const removeItemFromOrder = async (userId, orderId, itemId) => {
    // Get the order
    const order = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    if (!order) {
        throw new error_middleware_1.AppError('Order not found', 404);
    }
    // Ensure the order belongs to the authenticated user
    if (order.userId !== userId) {
        throw new error_middleware_1.AppError('Not authorized to access this order', 403);
    }
    // Ensure the order is active
    if (order.status !== enums_1.OrderStatus.ACTIVE) {
        throw new error_middleware_1.AppError('Cannot modify a completed order', 400);
    }
    // Find the order item
    const orderItem = await database_1.default.getRepository(order_product_entity_1.OrderProduct).findOne({
        where: { id: itemId, orderId },
    });
    if (!orderItem) {
        throw new error_middleware_1.AppError('Order item not found', 404);
    }
    // Delete the item
    await database_1.default.getRepository(order_product_entity_1.OrderProduct).remove(orderItem);
    // Get the updated order (or null if no items left)
    const updatedOrder = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    // If there are no items left, delete the order
    if (!updatedOrder?.orderProducts || updatedOrder.orderProducts.length === 0) {
        if (updatedOrder) {
            await order_repository_1.orderRepository.remove(updatedOrder);
        }
        return null;
    }
    return updatedOrder;
};
exports.removeItemFromOrder = removeItemFromOrder;
/**
 * Update order status
 */
const updateOrderStatusById = async (orderId, status) => {
    // Get the order
    const order = await order_repository_1.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
        throw new error_middleware_1.AppError('Order not found', 404);
    }
    // Update status
    order.status = status;
    // Save the updated order
    await order_repository_1.orderRepository.save(order);
    // Get the updated order with items
    const updatedOrder = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
    if (!updatedOrder) {
        throw new error_middleware_1.AppError('Error retrieving updated order', 500);
    }
    return updatedOrder;
};
exports.updateOrderStatusById = updateOrderStatusById;
