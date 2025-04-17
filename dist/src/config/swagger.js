"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const package_json_1 = require("../../package.json");
// Swagger definition
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'E-commerce API',
        version: package_json_1.version,
        description: 'RESTful API for an e-commerce platform',
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
        contact: {
            name: 'API Support',
            email: 'support@storefront-api.com',
        },
    },
    servers: [
        {
            url: `http://localhost:${process.env.PORT || 3000}${process.env.API_PREFIX || '/api'}`,
            description: 'Development server',
        },
        {
            url: 'https://api.example.com/api',
            description: 'Production server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    tags: [
        {
            name: 'Auth',
            description: 'Authentication endpoints',
        },
        {
            name: 'Users',
            description: 'User operations',
        },
        {
            name: 'Products',
            description: 'Product operations',
        },
        {
            name: 'Orders',
            description: 'Order operations',
        },
        {
            name: 'Payments',
            description: 'Payment operations',
        },
    ],
};
// Options for the swagger docs
const options = {
    swaggerDefinition,
    // Path to the API docs
    apis: [
        './src/routes/*.ts',
        './src/routes/**/*.ts',
        './src/controllers/*.ts',
        './src/controllers/**/*.ts',
        './src/models/*.ts',
        './src/models/**/*.ts',
        './src/entities/*.ts',
        './src/entities/**/*.ts',
        './src/types/*.ts',
        './dist/routes/*.js',
        './dist/routes/**/*.js',
        './dist/controllers/*.js',
        './dist/controllers/**/*.js',
        './dist/models/*.js',
        './dist/models/**/*.js',
        './dist/entities/*.js',
        './dist/entities/**/*.js',
        './dist/types/*.js',
    ],
};
// Initialize swagger-jsdoc
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
