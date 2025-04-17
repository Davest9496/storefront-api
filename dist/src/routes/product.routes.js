"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const product_validation_1 = require("../validations/product.validation");
const file_upload_middleware_1 = require("../middleware/file-upload.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     description: Retrieve all products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 6
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: xx99-mark-two
 *                           productName:
 *                             type: string
 *                             example: XX99 Mark II Headphones
 *                           price:
 *                             type: number
 *                             example: 299.99
 *                           category:
 *                             type: string
 *                             example: headphones
 *                           productDesc:
 *                             type: string
 *                           imageName:
 *                             type: string
 */
router.get('/', product_controller_1.getAllProducts);
/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     description: Retrieve featured/new products
 *     responses:
 *       200:
 *         description: A list of featured products
 */
router.get('/featured', product_controller_1.getFeaturedProducts);
/**
 * @swagger
 * /api/products/category/{category}:
 *   get:
 *     summary: Get products by category
 *     tags: [Products]
 *     description: Retrieve products by category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [headphones, speakers, earphones]
 *         description: Product category
 *     responses:
 *       200:
 *         description: A list of products by category
 *       400:
 *         description: Invalid category
 */
router.get('/category/:category', product_controller_1.getProductsByCategory);
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     description: Retrieve a specific product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', product_controller_1.getProductById);
/**
 * Admin routes - protected and restricted
 */
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     description: Create a new product (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - productName
 *               - price
 *               - category
 *               - imageName
 *             properties:
 *               id:
 *                 type: string
 *                 example: zx10-speaker
 *               productName:
 *                 type: string
 *                 example: ZX10 Speaker
 *               price:
 *                 type: number
 *                 example: 499.99
 *               category:
 *                 type: string
 *                 enum: [headphones, speakers, earphones]
 *                 example: speakers
 *               productDesc:
 *                 type: string
 *                 example: The best speaker available
 *               imageName:
 *                 type: string
 *                 example: product-zx10-speaker
 *               productFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               productAccessories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), (0, validation_middleware_1.validateRequest)(product_validation_1.productValidation.createProduct), product_controller_1.createProduct);
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     description: Update a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               price:
 *                 type: number
 *               productDesc:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [headphones, speakers, earphones]
 *               imageName:
 *                 type: string
 *               productFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               productAccessories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Product not found
 */
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), (0, validation_middleware_1.validateRequest)(product_validation_1.productValidation.updateProduct), product_controller_1.updateProduct);
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     description: Delete a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Product not found
 */
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), product_controller_1.deleteProduct);
/**
 * @swagger
 * /api/products/{id}/image:
 *   post:
 *     summary: Upload product image
 *     tags: [Products]
 *     description: Upload an image for a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No image provided
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Product not found
 */
router.post('/:id/image', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), file_upload_middleware_1.fileUpload.single('image'), product_controller_1.uploadProductImage);
exports.default = router;
