"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../middleware/validation.middleware");
const order_validation_1 = require("../validations/order.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const order_controller_1 = require("../controllers/order.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     tags: [Orders]
 *     description: Retrieve all active and completed orders for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeOrder:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         status:
 *                           type: string
 *                         orderProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *                     completedOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           orderProducts:
 *                             type: array
 *                             items:
 *                               type: object
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', auth_middleware_1.protect, order_controller_1.getUserOrders);
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a specific order by ID
 *     tags: [Orders]
 *     description: Retrieve a specific order by its ID with all related products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         status:
 *                           type: string
 *                         orderProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth_middleware_1.protect, order_controller_1.getOrderById);
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     description: Create a new order with products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   line1:
 *                     type: string
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       400:
 *         description: Invalid input or user already has an active order
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: One or more products not found
 *       500:
 *         description: Server error
 */
router.post('/', auth_middleware_1.protect, (0, validation_middleware_1.validateRequest)(order_validation_1.orderValidation.create), order_controller_1.createOrder);
/**
 * @swagger
 * /api/orders/{id}:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     description: Update the status of an order (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, complete]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), (0, validation_middleware_1.validateRequest)(order_validation_1.orderValidation.updateStatus), order_controller_1.updateOrderStatus);
/**
 * @swagger
 * /api/orders/{id}/items:
 *   post:
 *     summary: Add item to order
 *     tags: [Orders]
 *     description: Add a product to an existing order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to order successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       400:
 *         description: Invalid input or cannot modify completed order
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this order
 *       404:
 *         description: Order or product not found
 *       500:
 *         description: Server error
 */
router.post('/:id/items', auth_middleware_1.protect, (0, validation_middleware_1.validateRequest)(order_validation_1.orderValidation.addItem), order_controller_1.addItemToOrder);
/**
 * @swagger
 * /api/orders/{orderId}/items/{itemId}:
 *   patch:
 *     summary: Update item quantity
 *     tags: [Orders]
 *     description: Update the quantity of an item in an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item quantity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       400:
 *         description: Invalid input or cannot modify completed order
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this order
 *       404:
 *         description: Order or item not found
 *       500:
 *         description: Server error
 */
router.patch('/:orderId/items/:itemId', auth_middleware_1.protect, (0, validation_middleware_1.validateRequest)(order_validation_1.orderValidation.updateItem), order_controller_1.updateOrderItem);
/**
 * @swagger
 * /api/orders/{orderId}/items/{itemId}:
 *   delete:
 *     summary: Remove item from order
 *     tags: [Orders]
 *     description: Remove an item from an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order Item ID
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       400:
 *         description: Invalid input or cannot modify completed order
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this order
 *       404:
 *         description: Order or item not found
 *       500:
 *         description: Server error
 */
router.delete('/:orderId/items/:itemId', auth_middleware_1.protect, order_controller_1.removeOrderItem);
exports.default = router;
