import { Router } from 'express';
import healthRoutes from './health.route';
// Import future routes here
// import authRoutes from './auth.routes';
// import productRoutes from './product.routes';
// import orderRoutes from './order.routes';
// import paymentRoutes from './payment.routes';

const router = Router();

// Register routes
router.use('/health', healthRoutes);

// Future routes will be added here
// router.use('/auth', authRoutes);
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);
// router.use('/payments', paymentRoutes);

export default router;
