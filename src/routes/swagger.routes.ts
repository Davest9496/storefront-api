import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger';

const router = Router();

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
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec));

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
  res.send(swaggerSpec);
});

export default router;
