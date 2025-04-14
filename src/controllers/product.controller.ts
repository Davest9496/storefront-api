import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { AppError } from '../middleware/error.middleware';
import { ProductCategory } from '../types/enums';
import logger from '../utils/logger';

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await productService.getAllProducts();

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return next(new AppError(`Product not found with id: ${id}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
export const getProductsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { category } = req.params;

    // Validate category exists in enum
    if (!Object.values(ProductCategory).includes(category as ProductCategory)) {
      return next(new AppError(`Invalid category: ${category}`, 400));
    }

    const products = await productService.getProductsByCategory(category as ProductCategory);

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Admin only
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Admin only
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedProduct = await productService.updateProduct(id, req.body);

    if (!updatedProduct) {
      return next(new AppError(`Product not found with id: ${id}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Admin only
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      return next(new AppError(`Product not found with id: ${id}`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload product image to S3
 * @route   POST /api/products/:id/image
 * @access  Admin only
 */
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image file', 400));
    }

    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return next(new AppError(`Product not found with id: ${id}`, 404));
    }

    const imageUrl = await productService.uploadProductImage(
      id,
      req.file.buffer,
      req.file.mimetype,
    );

    // Update product with new image URL
    await productService.updateProduct(id, { imageName: imageUrl });

    res.status(200).json({
      status: 'success',
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    logger.error('Error uploading product image:', error);
    next(error);
  }
};

/**
 * @desc    Get new/featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await productService.getFeaturedProducts();

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};
