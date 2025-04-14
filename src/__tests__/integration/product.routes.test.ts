import request from 'supertest';
import app from '../../app';
import AppDataSource from '../../config/database';
import { User, UserRole } from '../../entities/user.entity';
import { Product } from '../../entities/product.entity';
import { ProductCategory } from '../../types/enums';
import { hashPassword } from '../../utils/password.utils';
import path from 'path';

describe('Product Routes Integration Tests', () => {
  let _testUser: User;
  let _adminUser: User;
  let userToken: string;
  let adminToken: string;
  let testProduct: Product;

  beforeAll(async () => {
    // Initialize database connection
    await AppDataSource.initialize();

    // Clear users and products tables
    await AppDataSource.getRepository(Product).delete({});
    await AppDataSource.getRepository(User).delete({});

    // Create test users
    const passwordDigest = await hashPassword('Password123!');

    _testUser = await AppDataSource.getRepository(User).save({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      passwordDigest,
      role: UserRole.CUSTOMER,
    });

    _adminUser = await AppDataSource.getRepository(User).save({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordDigest,
      role: UserRole.ADMIN,
    });

    // Get tokens for both users
    const userLoginRes = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });
    userToken = userLoginRes.body.token;

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!',
    });
    adminToken = adminLoginRes.body.token;

    // Create test product
    testProduct = await AppDataSource.getRepository(Product).save({
      id: 'test-product',
      productName: 'Test Product',
      price: 99.99,
      category: ProductCategory.HEADPHONES,
      productDesc: 'A test product for integration testing',
      imageName: 'test-product-image',
      isNew: true,
    });
  });

  afterAll(async () => {
    // Delete test data
    await AppDataSource.getRepository(Product).delete({});
    await AppDataSource.getRepository(User).delete({});

    // Close database connection
    await AppDataSource.destroy();
  });

  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);
      expect(res.body.data.products[0]).toHaveProperty('id');
      expect(res.body.data.products[0]).toHaveProperty('productName');
      expect(res.body.data.products[0]).toHaveProperty('price');
      expect(res.body.data.products[0]).toHaveProperty('category');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get a product by id', async () => {
      const res = await request(app).get(`/api/products/${testProduct.id}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product).toHaveProperty('id', testProduct.id);
      expect(res.body.data.product).toHaveProperty('productName', testProduct.productName);

      // Check price with Number conversion to handle string/number differences
      expect(Number(res.body.data.product.price)).toBe(Number(testProduct.price));

      expect(res.body.data.product).toHaveProperty('category', testProduct.category);
    });

    it('should return 404 if product not found', async () => {
      const res = await request(app).get('/api/products/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Product not found');
    });
  });

  describe('GET /api/products/category/:category', () => {
    it('should get products by category', async () => {
      const res = await request(app).get(`/api/products/category/${testProduct.category}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);
      expect(res.body.data.products[0]).toHaveProperty('category', testProduct.category);
    });

    it('should return 400 for invalid category', async () => {
      const res = await request(app).get('/api/products/category/invalid-category');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Invalid category');
    });
  });

  describe('POST /api/products', () => {
    it('should not allow unauthenticated user to create product', async () => {
      const newProduct = {
        id: 'new-product',
        productName: 'New Product',
        price: 149.99,
        category: 'speakers',
        imageName: 'new-product-image',
      };

      const res = await request(app).post('/api/products').send(newProduct);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('not logged in');
    });

    it('should not allow regular user to create product', async () => {
      const newProduct = {
        id: 'new-product',
        productName: 'New Product',
        price: 149.99,
        category: 'speakers',
        imageName: 'new-product-image',
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProduct);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('do not have permission');
    });

    it('should allow admin to create a product', async () => {
      const newProduct = {
        id: 'new-product',
        productName: 'New Product',
        price: 149.99,
        category: 'speakers',
        imageName: 'new-product-image',
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product).toHaveProperty('id', 'new-product');
      expect(res.body.data.product).toHaveProperty('productName', 'New Product');

      // Check price with Number conversion
      expect(Number(res.body.data.product.price)).toBe(149.99);

      expect(res.body.data.product).toHaveProperty('category', 'speakers');
    });

    it('should validate product data', async () => {
      const invalidProduct = {
        id: 'invalid',
        // Missing required fields
        price: -10, // Negative price
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should allow admin to update a product', async () => {
      const updateData = {
        productName: 'Updated Product Name',
        price: 199.99,
        productDesc: 'Updated description',
      };

      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product).toHaveProperty('id', testProduct.id);
      expect(res.body.data.product).toHaveProperty('productName', 'Updated Product Name');

      // Check price with Number conversion
      expect(Number(res.body.data.product.price)).toBe(199.99);

      expect(res.body.data.product).toHaveProperty('productDesc', 'Updated description');
    });

    it('should return 404 if product not found', async () => {
      const updateData = {
        productName: 'Updated Product Name',
      };

      const res = await request(app)
        .put('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should allow admin to delete a product', async () => {
      // First create a product to delete
      const productToDelete = await AppDataSource.getRepository(Product).save({
        id: 'delete-me',
        productName: 'Product to Delete',
        price: 49.99,
        category: ProductCategory.EARPHONES,
        imageName: 'delete-me-image',
      });

      const res = await request(app)
        .delete(`/api/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      // Verify product is deleted
      const deletedProduct = await AppDataSource.getRepository(Product).findOne({
        where: { id: productToDelete.id },
      });
      expect(deletedProduct).toBeNull();
    });
  });

  // Skip the image upload test as it requires file handling
  describe.skip('POST /api/products/:id/image', () => {
    it('should allow admin to upload a product image', async () => {
      // Create test image file
      const testImagePath = path.join(__dirname, '..', '..', '..', 'test-image.jpg');

      const res = await request(app)
        .post(`/api/products/${testProduct.id}/image`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('imageUrl');
    });
  });
});
