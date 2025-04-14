import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getFeaturedProducts,
} from '../controllers/product.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { productValidation } from '../validations/product.validation';
import { fileUpload } from '../middleware/file-upload.middleware';

const router = Router();

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
router.get('/', getAllProducts);

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
router.get('/featured', getFeaturedProducts);

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
router.get('/category/:category', getProductsByCategory);

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
router.get('/:id', getProductById);

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
router.post(
  '/',
  protect,
  restrictTo('admin'),
  validateRequest(productValidation.createProduct),
  createProduct,
);

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
router.put(
  '/:id',
  protect,
  restrictTo('admin'),
  validateRequest(productValidation.updateProduct),
  updateProduct,
);

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
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

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
router.post(
  '/:id/image',
  protect,
  restrictTo('admin'),
  fileUpload.single('image'),
  uploadProductImage,
);

export default router;
