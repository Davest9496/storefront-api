"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeaturedProducts = exports.uploadProductImage = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsByCategory = exports.getProductById = exports.getAllProducts = void 0;
const product_service_1 = require("../services/product.service");
const error_middleware_1 = require("../middleware/error.middleware");
const enums_1 = require("../types/enums");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res, next) => {
    try {
        const products = await product_service_1.productService.getAllProducts();
        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllProducts = getAllProducts;
/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await product_service_1.productService.getProductById(id);
        if (!product) {
            return next(new error_middleware_1.AppError(`Product not found with id: ${id}`, 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                product,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
const getProductsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        // Validate category exists in enum
        if (!Object.values(enums_1.ProductCategory).includes(category)) {
            return next(new error_middleware_1.AppError(`Invalid category: ${category}`, 400));
        }
        const products = await product_service_1.productService.getProductsByCategory(category);
        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductsByCategory = getProductsByCategory;
/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Admin only
 */
const createProduct = async (req, res, next) => {
    try {
        const product = await product_service_1.productService.createProduct(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                product,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Admin only
 */
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedProduct = await product_service_1.productService.updateProduct(id, req.body);
        if (!updatedProduct) {
            return next(new error_middleware_1.AppError(`Product not found with id: ${id}`, 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                product: updatedProduct,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Admin only
 */
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await product_service_1.productService.deleteProduct(id);
        if (!deleted) {
            return next(new error_middleware_1.AppError(`Product not found with id: ${id}`, 404));
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
/**
 * @desc    Upload product image to S3
 * @route   POST /api/products/:id/image
 * @access  Admin only
 */
const uploadProductImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new error_middleware_1.AppError('Please upload an image file', 400));
        }
        const { id } = req.params;
        const product = await product_service_1.productService.getProductById(id);
        if (!product) {
            return next(new error_middleware_1.AppError(`Product not found with id: ${id}`, 404));
        }
        const imageUrl = await product_service_1.productService.uploadProductImage(id, req.file.buffer, req.file.mimetype);
        // Update product with new image URL
        await product_service_1.productService.updateProduct(id, { imageName: imageUrl });
        res.status(200).json({
            status: 'success',
            data: {
                imageUrl,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error uploading product image:', error);
        next(error);
    }
};
exports.uploadProductImage = uploadProductImage;
/**
 * @desc    Get new/featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = async (req, res, next) => {
    try {
        const products = await product_service_1.productService.getFeaturedProducts();
        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
