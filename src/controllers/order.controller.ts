import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { orderRepository } from '../repositories/order.repository';
import * as orderService from '../services/order.service';

/**
 * @desc    Get all orders for the authenticated user
 * @route   GET /api/orders
 * @access  Private
 */
export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    // Get active order
    const activeOrder = await orderRepository.findUserActiveOrder(req.user.id);

    // Get completed orders
    const completedOrders = await orderRepository.findUserCompletedOrders(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        activeOrder,
        completedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    // Get order with all related data
    const order = await orderRepository.findOrderWithDetails(orderId);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Ensure the order belongs to the authenticated user or user is admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to access this order', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id
 * @access  Private/Admin
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return next(new AppError('Invalid order ID', 400));
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to order
 * @route   POST /api/orders/:id/items
 * @access  Private
 */
export const addItemToOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const { productId, quantity } = req.body;

    // Add item to order using service
    const updatedOrder = await orderService.addItemToExistingOrder(
      req.user.id,
      orderId,
      productId,
      quantity,
    );

    res.status(200).json({
      status: 'success',
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update item quantity
 * @route   PATCH /api/orders/:orderId/items/:itemId
 * @access  Private
 */
export const updateOrderItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    const orderId = parseInt(req.params.orderId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(orderId) || isNaN(itemId)) {
      return next(new AppError('Invalid order or item ID', 400));
    }

    const { quantity } = req.body;

    // Update order item quantity using service
    const updatedOrder = await orderService.updateOrderItemQuantity(
      req.user.id,
      orderId,
      itemId,
      quantity,
    );

    res.status(200).json({
      status: 'success',
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove item from order
 * @route   DELETE /api/orders/:orderId/items/:itemId
 * @access  Private
 */
export const removeOrderItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user exists on the request
    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    const orderId = parseInt(req.params.orderId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(orderId) || isNaN(itemId)) {
      return next(new AppError('Invalid order or item ID', 400));
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
  } catch (error) {
    next(error);
  }
};
