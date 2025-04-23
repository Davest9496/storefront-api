import { Order } from '../entities/order.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { OrderStatus } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { productRepository } from '../repositories/product.repository';
import { orderRepository } from '../repositories/order.repository';
import AppDataSource from '../config/database';

// Interface for order items in request
interface OrderItem {
  productId: string;
  quantity: number;
}

// Interface for shipping address
interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Calculate order total based on products and quantities
 */
export const calculateOrderTotal = async (items: OrderItem[]): Promise<number> => {
  let total = 0;

  // Get all products in a single query
  const productIds = items.map((item) => item.productId);
  const products = await productRepository.findByIds(productIds);

  // Calculate total
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);

    if (!product) {
      throw new AppError(`Product with ID ${item.productId} not found`, 404);
    }

    total += product.price * item.quantity;
  }

  return total;
};

/**
 * Create a new order
 */
export const createNewOrder = async (
  userId: number,
  items: OrderItem[],
  _shippingAddress?: ShippingAddress,
): Promise<Order> => {
  // Start a transaction
  return AppDataSource.transaction(async (transactionalEntityManager) => {
    // Check if user already has an active order
    const existingActiveOrder = await orderRepository.findUserActiveOrder(userId);

    if (existingActiveOrder) {
      throw new AppError('You already have an active order', 400);
    }

    // Validate that products exist and have enough inventory
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one product', 400);
    }

    // Get all products in a single query
    const productIds = items.map((item) => item.productId);
    const products = await productRepository.findByIds(productIds);

    // Check if all products exist
    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found', 404);
    }

    // Create new order
    const order = orderRepository.create({
      userId,
      status: OrderStatus.ACTIVE,
    });

    // Save the order to get its ID
    const savedOrder = await transactionalEntityManager.save(order);

    // Create order items
    const orderItems: OrderProduct[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new AppError(`Product with ID ${item.productId} not found`, 404);
      }

      const orderItem = new OrderProduct();
      orderItem.orderId = savedOrder.id;
      orderItem.productId = product.id;
      orderItem.quantity = item.quantity;

      orderItems.push(orderItem);
    }

    // Save order items
    await transactionalEntityManager.save(orderItems);

    // Get the complete order with items
    const completeOrder = await transactionalEntityManager.findOne(Order, {
      where: { id: savedOrder.id },
      relations: ['orderProducts', 'orderProducts.product', 'user'],
    });

    if (!completeOrder) {
      throw new AppError('Error retrieving created order', 500);
    }

    return completeOrder;
  });
};

/**
 * Add item to an existing order
 */
export const addItemToExistingOrder = async (
  userId: number,
  orderId: number,
  productId: string,
  quantity: number,
): Promise<Order> => {
  // Get the order
  const order = await orderRepository.findOrderWithDetails(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Ensure the order belongs to the authenticated user
  if (order.userId !== userId) {
    throw new AppError('Not authorized to access this order', 403);
  }

  // Ensure the order is active
  if (order.status !== OrderStatus.ACTIVE) {
    throw new AppError('Cannot modify a completed order', 400);
  }

  // Check if the product exists
  const product = await productRepository.findOne({ where: { id: productId } });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if the product is already in the order
  const existingItem = order.orderProducts?.find((item) => item.productId === productId);

  if (existingItem) {
    // Update quantity instead of adding a new item
    existingItem.quantity += quantity;
    await AppDataSource.getRepository(OrderProduct).save(existingItem);
  } else {
    // Create new order item
    const orderItem = new OrderProduct();
    orderItem.orderId = orderId;
    orderItem.productId = productId;
    orderItem.quantity = quantity;

    await AppDataSource.getRepository(OrderProduct).save(orderItem);
  }

  // Get the updated order
  const updatedOrder = await orderRepository.findOrderWithDetails(orderId);

  if (!updatedOrder) {
    throw new AppError('Error retrieving updated order', 500);
  }

  return updatedOrder;
};

/**
 * Update order item quantity
 */
export const updateOrderItemQuantity = async (
  userId: number,
  orderId: number,
  itemId: number,
  quantity: number,
): Promise<Order> => {
  // Get the order
  const order = await orderRepository.findOrderWithDetails(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Ensure the order belongs to the authenticated user
  if (order.userId !== userId) {
    throw new AppError('Not authorized to access this order', 403);
  }

  // Ensure the order is active
  if (order.status !== OrderStatus.ACTIVE) {
    throw new AppError('Cannot modify a completed order', 400);
  }

  // Find the order item
  const orderItem = await AppDataSource.getRepository(OrderProduct).findOne({
    where: { id: itemId, orderId },
  });

  if (!orderItem) {
    throw new AppError('Order item not found', 404);
  }

  // Update quantity
  orderItem.quantity = quantity;

  // Save updated item
  await AppDataSource.getRepository(OrderProduct).save(orderItem);

  // Get the updated order
  const updatedOrder = await orderRepository.findOrderWithDetails(orderId);

  if (!updatedOrder) {
    throw new AppError('Error retrieving updated order', 500);
  }

  return updatedOrder;
};

/**
 * Remove item from order
 */
export const removeItemFromOrder = async (
  userId: number,
  orderId: number,
  itemId: number,
): Promise<Order | null> => {
  // Get the order
  const order = await orderRepository.findOrderWithDetails(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Ensure the order belongs to the authenticated user
  if (order.userId !== userId) {
    throw new AppError('Not authorized to access this order', 403);
  }

  // Ensure the order is active
  if (order.status !== OrderStatus.ACTIVE) {
    throw new AppError('Cannot modify a completed order', 400);
  }

  // Find the order item
  const orderItem = await AppDataSource.getRepository(OrderProduct).findOne({
    where: { id: itemId, orderId },
  });

  if (!orderItem) {
    throw new AppError('Order item not found', 404);
  }

  // Delete the item
  await AppDataSource.getRepository(OrderProduct).remove(orderItem);

  // Get the updated order (or null if no items left)
  const updatedOrder = await orderRepository.findOrderWithDetails(orderId);

  // If there are no items left, delete the order
  if (!updatedOrder?.orderProducts || updatedOrder.orderProducts.length === 0) {
    if (updatedOrder) {
      await orderRepository.remove(updatedOrder);
    }
    return null;
  }

  return updatedOrder;
};

/**
 * Update order status
 */
export const updateOrderStatusById = async (
  orderId: number,
  status: OrderStatus,
): Promise<Order> => {
  // Get the order
  const order = await orderRepository.findOne({ where: { id: orderId } });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update status
  order.status = status;

  // Save the updated order
  await orderRepository.save(order);

  // Get the updated order with items
  const updatedOrder = await orderRepository.findOrderWithDetails(orderId);

  if (!updatedOrder) {
    throw new AppError('Error retrieving updated order', 500);
  }

  return updatedOrder;
};
