# E-commerce Database Design

## Database Schema

The e-commerce database consists of the following tables:

1. **users** - Stores user information
2. **products** - Stores product information
3. **orders** - Stores order information
4. **order_products** - Junction table for the many-to-many relationship between orders and products
5. **payments** - Stores payment information

## Entity Relationships

- A **User** can have many **Orders**
- An **Order** belongs to one **User**
- An **Order** can have many **Products** through **OrderProducts**
- A **Product** can be in many **Orders** through **OrderProducts**
- An **Order** can have one **Payment**
- A **Payment** belongs to one **Order**

## Enhancements

### 1. Product "is_new" Feature

We've added an `is_new` boolean field to the products table that is automatically calculated based on the creation date of the product. This enhancement allows us to:

- Easily identify and filter new products (less than 30 days old)
- Display a "NEW" badge on product listings in the frontend
- Implement special promotions or sorting for new products

**Implementation Details:**

1. **Database Level:**
   - Added `is_new` boolean field with default value of `true`
   - Added `created_at` and `updated_at` timestamp fields

2. **Entity Level:**
   - Used TypeORM's `@AfterLoad` decorator to automatically calculate the `isNew` property based on the `createdAt` date
   - Used TypeORM's `@BeforeInsert` decorator to set `isNew` to `true` for new products

3. **Repository Level:**
   - Added a `findNewProducts()` method that returns products less than 30 days old

### 2. Timestamps for All Entities

We've added automatic timestamp tracking to all entities:

- `created_at`: Set automatically when a record is created
- `updated_at`: Updated automatically when a record is modified

### 3. Payment Integration

We've added a **payments** table to support integration with payment providers:

- Supports multiple payment providers (Stripe, PayPal)
- Tracks payment status (pending, completed, failed)
- Stores provider transaction IDs for reconciliation

### 4. Database Indexing

We've added strategic indexes to improve query performance:

- `idx_users_email`: Speeds up user lookups by email
- `idx_products_category`: Improves product filtering by category
- `idx_orders_user_id`: Improves retrieval of orders for a specific user
- `idx_order_products_order_id`: Speeds up retrieval of products in an order
- `idx_order_products_product_id`: Speeds up finding orders containing a specific product

## AWS RDS Configuration

The database is designed to run on AWS RDS PostgreSQL (t2.micro instance) within the free tier limitations:

- Connection pooling configured for optimal performance
- Minimal resource usage to stay within free tier limits
- SSL support for secure database connections in production

## Migration Strategy

Database changes are managed through TypeORM migrations:

- Initial migration creates the complete schema
- Seed script populates the database with initial test data
- Migration scripts can be run using the command: `npm run migration:run`
- Database can be seeded using the command: `npm run db:seed`

## Repository Pattern

We've implemented the repository pattern to abstract database operations:

- Each entity has its own repository
- Repositories provide specialized query methods
- Repository methods handle complex queries and relationships