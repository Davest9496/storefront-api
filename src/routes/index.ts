import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Add more routes here as they are implemented
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);
// router.use('/payments', paymentRoutes);

export default router;
