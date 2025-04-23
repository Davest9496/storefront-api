import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import swaggerRoutes from './swagger.routes';
import orderRoutes from './order.routes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Product routes
router.use('/products', productRoutes);

// Order Routes
router.use('/orders', orderRoutes);

// API Documentation
router.use('/api-docs', swaggerRoutes);

export default router;
