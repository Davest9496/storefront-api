"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPaymentRepository = exports.testOrderProductRepository = exports.testOrderRepository = exports.testProductRepository = exports.testUserRepository = void 0;
const test_database_1 = __importDefault(require("../../config/test-database"));
const user_entity_1 = require("../../entities/user.entity");
const product_entity_1 = require("../../entities/product.entity");
const order_entity_1 = require("../../entities/order.entity");
const order_product_entity_1 = require("../../entities/order-product.entity");
const payment_entity_1 = require("../../entities/payment.entity");
// Initialize repositories that use the test database
exports.testUserRepository = test_database_1.default.getRepository(user_entity_1.User);
exports.testProductRepository = test_database_1.default.getRepository(product_entity_1.Product);
exports.testOrderRepository = test_database_1.default.getRepository(order_entity_1.Order);
exports.testOrderProductRepository = test_database_1.default.getRepository(order_product_entity_1.OrderProduct);
exports.testPaymentRepository = test_database_1.default.getRepository(payment_entity_1.Payment);
