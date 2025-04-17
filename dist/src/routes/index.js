"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const swagger_routes_1 = __importDefault(require("./swagger.routes"));
const router = (0, express_1.Router)();
// Health check routes
router.use('/health', health_routes_1.default);
// Authentication routes
router.use('/auth', auth_routes_1.default);
// Product routes
router.use('/products', product_routes_1.default);
// API Documentation
router.use('/api-docs', swagger_routes_1.default);
exports.default = router;
