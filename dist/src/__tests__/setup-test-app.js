"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataSource = void 0;
exports.initializeTestApp = initializeTestApp;
exports.closeTestApp = closeTestApp;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const user_entity_1 = require("../entities/user.entity");
const product_entity_1 = require("../entities/product.entity");
const order_entity_1 = require("../entities/order.entity");
const order_product_entity_1 = require("../entities/order-product.entity");
const payment_entity_1 = require("../entities/payment.entity");
const logger_1 = __importDefault(require("../utils/logger"));
// Load test environment variables
(0, dotenv_1.config)({ path: '.env.test' });
// Create a special test data source
exports.TestDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'storefront_test',
    synchronize: true,
    dropSchema: true,
    entities: [user_entity_1.User, product_entity_1.Product, order_entity_1.Order, order_product_entity_1.OrderProduct, payment_entity_1.Payment],
    logging: false,
});
// Override the imported AppDataSource in your application
jest.mock('../config/database', () => {
    // Initialize and return our test data source
    return {
        __esModule: true,
        default: exports.TestDataSource,
    };
});
// Initialize the test database
async function initializeTestApp() {
    if (!exports.TestDataSource.isInitialized) {
        await exports.TestDataSource.initialize();
        logger_1.default.info('Test database initialized'); // Use logger instead of console
    }
    // Use dynamic import instead of require
    const appModule = await Promise.resolve().then(() => __importStar(require('../app')));
    return appModule.default;
}
// Close the test database
async function closeTestApp() {
    if (exports.TestDataSource.isInitialized) {
        await exports.TestDataSource.destroy();
        logger_1.default.info('Test database connection closed'); // Use logger instead of console
    }
}
