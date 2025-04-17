"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("../config/swagger"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API Documentation
 *     description: Access Swagger UI for the API documentation
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 */
router.use('/', swagger_ui_express_1.default.serve);
router.get('/', swagger_ui_express_1.default.setup(swagger_1.default));
/**
 * @swagger
 * /api-docs.json:
 *   get:
 *     summary: API Documentation JSON
 *     description: Returns the OpenAPI specification in JSON format
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 */
router.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.default);
});
exports.default = router;
