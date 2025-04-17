"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const user_validation_1 = require("../validations/user.validation");
const user_entity_1 = require("../entities/user.entity");
const router = (0, express_1.Router)();
// Profile routes (protected)
router.use('/profile', auth_middleware_1.protect);
router.get('/profile', user_controller_1.userController.getProfile);
router.patch('/profile', (0, validation_middleware_1.validateRequest)(user_validation_1.userValidation.updateProfile), user_controller_1.userController.updateProfile);
// Password reset (public)
router.post('/forgot-password', (0, validation_middleware_1.validateRequest)(user_validation_1.userValidation.requestPasswordReset), user_controller_1.userController.forgotPassword);
router.post('/reset-password', (0, validation_middleware_1.validateRequest)(user_validation_1.userValidation.resetPassword), user_controller_1.userController.resetPassword);
// Admin routes
router.use('/admin', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(user_entity_1.UserRole.ADMIN));
router.get('/admin/users', user_controller_1.userController.getAllUsers);
router.get('/admin/users/:id', user_controller_1.userController.getUserById);
router.patch('/admin/users/:id/role', (0, validation_middleware_1.validateRequest)(user_validation_1.userValidation.updateUserRole), user_controller_1.userController.updateUserRole);
exports.default = router;
