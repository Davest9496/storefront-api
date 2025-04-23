"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOrderItem = exports.updateOrderItem = exports.addItemToOrder = exports.updateOrderStatus = exports.createOrder = exports.getOrderById = exports.getUserOrders = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const order_repository_1 = require("../repositories/order.repository");
const orderService = __importStar(require("../services/order.service"));
/**
 * @desc    Get all orders for the authenticated user
 * @route   GET /api/orders
 * @access  Private
 */
const getUserOrders = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        // Get active order
        const activeOrder = await order_repository_1.orderRepository.findUserActiveOrder(req.user.id);
        // Get completed orders
        const completedOrders = await order_repository_1.orderRepository.findUserCompletedOrders(req.user.id);
        res.status(200).json({
            status: 'success',
            data: {
                activeOrder,
                completedOrders,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserOrders = getUserOrders;
/**
 * @desc    Get a specific order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) {
            return next(new error_middleware_1.AppError('Invalid order ID', 400));
        }
        // Get order with all related data
        const order = await order_repository_1.orderRepository.findOrderWithDetails(orderId);
        if (!order) {
            return next(new error_middleware_1.AppError('Order not found', 404));
        }
        // Ensure the order belongs to the authenticated user or user is admin
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            return next(new error_middleware_1.AppError('Not authorized to access this order', 403));
        }
        res.status(200).json({
            status: 'success',
            data: {
                order,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderById = getOrderById;
/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        const { items, shippingAddress } = req.body;
        // Create order using service
        const order = await orderService.createNewOrder(req.user.id, items, shippingAddress);
        res.status(201).json({
            status: 'success',
            data: {
                order,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) {
            return next(new error_middleware_1.AppError('Invalid order ID', 400));
        }
        const { status } = req.body;
        // Update order status using service
        const updatedOrder = await orderService.updateOrderStatusById(orderId, status);
        res.status(200).json({
            status: 'success',
            data: {
                order: updatedOrder,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
/**
 * @desc    Add item to order
 * @route   POST /api/orders/:id/items
 * @access  Private
 */
const addItemToOrder = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) {
            return next(new error_middleware_1.AppError('Invalid order ID', 400));
        }
        const { productId, quantity } = req.body;
        // Add item to order using service
        const updatedOrder = await orderService.addItemToExistingOrder(req.user.id, orderId, productId, quantity);
        res.status(200).json({
            status: 'success',
            data: {
                order: updatedOrder,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addItemToOrder = addItemToOrder;
/**
 * @desc    Update item quantity
 * @route   PATCH /api/orders/:orderId/items/:itemId
 * @access  Private
 */
const updateOrderItem = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        const orderId = parseInt(req.params.orderId, 10);
        const itemId = parseInt(req.params.itemId, 10);
        if (isNaN(orderId) || isNaN(itemId)) {
            return next(new error_middleware_1.AppError('Invalid order or item ID', 400));
        }
        const { quantity } = req.body;
        // Update order item quantity using service
        const updatedOrder = await orderService.updateOrderItemQuantity(req.user.id, orderId, itemId, quantity);
        res.status(200).json({
            status: 'success',
            data: {
                order: updatedOrder,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderItem = updateOrderItem;
/**
 * @desc    Remove item from order
 * @route   DELETE /api/orders/:orderId/items/:itemId
 * @access  Private
 */
const removeOrderItem = async (req, res, next) => {
    try {
        // Check if user exists on the request
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not found', 401));
        }
        const orderId = parseInt(req.params.orderId, 10);
        const itemId = parseInt(req.params.itemId, 10);
        if (isNaN(orderId) || isNaN(itemId)) {
            return next(new error_middleware_1.AppError('Invalid order or item ID', 400));
        }
        // Remove item from order using service
        const updatedOrder = await orderService.removeItemFromOrder(req.user.id, orderId, itemId);
        // If order was deleted (no items left)
        if (!updatedOrder) {
            res.status(200).json({
                status: 'success',
                message: 'Order deleted because it had no items',
                data: null,
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                order: updatedOrder,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeOrderItem = removeOrderItem;
