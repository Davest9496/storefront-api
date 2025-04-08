# E-commerce Backend API Design System

## 1. System Overview

This document outlines the design system for an e-commerce backend API that will connect to an existing Angular frontend. The system will be built with TypeScript using strict typing and deployed on AWS within the free tier limitations. The database will be hosted on AWS RDS free tier.

### 1.1 Core Requirements
- TypeScript with strict typing
- AWS deployment (free tier)
- Database on AWS RDS (free tier)
- User authentication (signup, login, session management)
- Payment system integration (Stripe, PayPal)
- REST API endpoints for e-commerce functionality
- Integration with existing Angular frontend deployed on Vercel

## 2. Architecture

### 2.1 System Architecture

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│    Angular     │◄────►│   TypeScript   │◄────►│   AWS RDS      │
│    Frontend    │      │   API Server   │      │   Database     │
│    (Vercel)    │      │   (AWS)        │      │                │
│                │      │                │      │                │
└────────────────┘      └─────┬──────────┘      └────────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
        ┌─────────▼──────┐      ┌─────────▼──────┐
        │                │      │                │
        │  Stripe API    │      │  PayPal API    │
        │                │      │                │
        └────────────────┘      └────────────────┘
```

### 2.2 Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL on AWS RDS
- **ORM**: TypeORM or Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting**: AWS Lambda + API Gateway
- **Payment Processing**: Stripe and PayPal SDKs
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Testing**: Jest
- **CI/CD**: GitHub Actions

## 3. Database Design

### 3.1 Entity Relationship Diagram (High-level)

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│  Users    │       │  Orders   │       │ Products  │
├───────────┤       ├───────────┤       ├───────────┤
│ id        │       │ id        │       │ id        │
│ email     │       │ userId    │◄─┐    │ name      │
│ password  │       │ status    │  │    │ price     │
│ name      │◄──────┤ total     │  │    │ stock     │
│ role      │       │ createdAt │  │    │ images    │
│ createdAt │       └───────────┘  │    │ category  │
└───────────┘                      │    └───────────┘
                                   │          ▲
┌───────────┐       ┌───────────┐  │          │
│ Payments  │       │ OrderItems│  │          │
├───────────┤       ├───────────┤  │          │
│ id        │       │ id        │  │          │
│ orderId   │◄──────┤ orderId   │──┘          │
│ amount    │       │ productId │─────────────┘
│ provider  │       │ quantity  │
│ status    │       │ price     │
│ createdAt │       └───────────┘
└───────────┘
```

### 3.2 Main Entities

1. **Users**
   - id: UUID (primary key)
   - email: string (unique)
   - password: string (hashed)
   - name: string
   - role: enum (customer, admin)
   - createdAt: timestamp

2. **Products**
   - id: UUID (primary key)
   - name: string
   - description: text
   - price: decimal
   - stock: integer
   - images: string[] (URLs)
   - category: string
   - createdAt: timestamp

3. **Orders**
   - id: UUID (primary key)
   - userId: UUID (foreign key)
   - status: enum (pending, paid, shipped, delivered, canceled)
   - total: decimal
   - shippingAddress: JSON
   - createdAt: timestamp

4. **OrderItems**
   - id: UUID (primary key)
   - orderId: UUID (foreign key)
   - productId: UUID (foreign key)
   - quantity: integer
   - price: decimal (price at time of order)

5. **Payments**
   - id: UUID (primary key)
   - orderId: UUID (foreign key)
   - amount: decimal
   - provider: enum (stripe, paypal)
   - status: enum (pending, completed, failed)
   - providerTransactionId: string
   - createdAt: timestamp

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint           | Description                    | Request Body                       | Response                            |
|--------|-------------------|--------------------------------|------------------------------------|------------------------------------|
| POST   | /api/auth/signup  | Register a new user            | {email, password, name}           | {id, email, name, token}           |
| POST   | /api/auth/login   | Login a user                   | {email, password}                 | {id, email, name, token}           |
| POST   | /api/auth/logout  | Logout a user                  | {}                                | {success: true}                    |
| GET    | /api/auth/me      | Get current user information   | -                                  | {id, email, name}                  |

### 4.2 Products

| Method | Endpoint                | Description                    | Request Body                       | Response                            |
|--------|------------------------|--------------------------------|------------------------------------|------------------------------------|
| GET    | /api/products          | Get all products               | -                                  | [{id, name, price, ...}]            |
| GET    | /api/products/:id      | Get a specific product         | -                                  | {id, name, price, ...}              |
| GET    | /api/products/category/:category | Get products by category | -                              | [{id, name, price, ...}]            |
| POST   | /api/products          | Create a product (admin)       | {name, description, price, ...}   | {id, name, price, ...}              |
| PUT    | /api/products/:id      | Update a product (admin)       | {name, description, price, ...}   | {id, name, price, ...}              |
| DELETE | /api/products/:id      | Delete a product (admin)       | -                                  | {success: true}                    |

### 4.3 Orders

| Method | Endpoint               | Description                    | Request Body                       | Response                            |
|--------|------------------------|--------------------------------|------------------------------------|------------------------------------|
| GET    | /api/orders            | Get user's orders              | -                                  | [{id, status, total, ...}]          |
| GET    | /api/orders/:id        | Get a specific order           | -                                  | {id, status, items: [...], ...}     |
| POST   | /api/orders            | Create a new order             | {items: [{productId, quantity}]}  | {id, status, total, ...}           |
| PUT    | /api/orders/:id        | Update order status (admin)    | {status}                          | {id, status, ...}                  |

### 4.4 Payments

| Method | Endpoint                  | Description                    | Request Body                       | Response                            |
|--------|---------------------------|--------------------------------|------------------------------------|------------------------------------|
| POST   | /api/payments/stripe      | Process Stripe payment         | {orderId, token}                  | {success, paymentId}               |
| POST   | /api/payments/paypal      | Process PayPal payment         | {orderId, paypalData}             | {success, paymentId}               |
| GET    | /api/payments/:id         | Get payment information        | -                                  | {id, status, amount, ...}          |

## 5. Authentication & Authorization

### 5.1 JWT Authentication Flow

1. User submits credentials (email/password)
2. Server validates credentials
3. If valid, server generates JWT with:
   - User ID
   - User role (admin/customer)
   - Expiration time (1 hour)
4. JWT is sent to client
5. Client stores JWT in:
   - HTTP-only cookie (preferred for security)
   - Or localStorage (less secure but simpler)
6. Client includes JWT in Authorization header for subsequent requests
7. Server validates JWT on each protected endpoint

### 5.2 Authorization Middleware

```typescript
// Example authorization middleware
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify JWT
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      
      // Check role authorization if specified
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};
```

## 6. Payment Integration

### 6.1 Stripe Integration

```typescript
// Example Stripe payment processing
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export const processStripePayment = async (orderId: string, token: string, amount: number) => {
  try {
    const payment = await stripe.charges.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency: 'usd',
      description: `Order ${orderId}`,
      source: token
    });
    
    return {
      success: true,
      paymentId: payment.id
    };
  } catch (error) {
    throw new Error(`Payment failed: ${error.message}`);
  }
};
```

### 6.2 PayPal Integration

```typescript
// Example PayPal payment processing with SDK
import { PayPalHttpClient, Orders } from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_CLIENT_SECRET!
);
const client = new PayPalHttpClient(environment);

export const processPayPalPayment = async (orderId: string, paypalOrderId: string) => {
  try {
    const request = new Orders.OrdersCaptureRequest(paypalOrderId);
    const response = await client.execute(request);
    
    return {
      success: true,
      paymentId: response.result.id
    };
  } catch (error) {
    throw new Error(`PayPal payment failed: ${error.message}`);
  }
};
```

## 7. AWS Deployment Architecture

### 7.1 Free Tier Considerations

To stay within AWS Free Tier:
- AWS RDS PostgreSQL: t2.micro instance with 20GB storage
- AWS Lambda: 1 million free requests per month
- API Gateway: 1 million API calls per month
- S3: 5GB storage for product images
- CloudWatch: Basic monitoring

### 7.2 Serverless Architecture

Using AWS Lambda + API Gateway for a serverless approach:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  API Gateway  │────►│  AWS Lambda   │────►│  AWS RDS      │
│  (REST API)   │     │  Functions    │     │  PostgreSQL   │
└───────────────┘     └───────────────┘     └───────────────┘
                             │
                      ┌──────┴──────┐
                      │             │
              ┌───────▼────┐  ┌─────▼───────┐
              │  AWS S3    │  │ CloudWatch  │
              │ (Storage)  │  │ (Logs)      │
              └────────────┘  └─────────────┘
```

### 7.3 Lambda Function Organization

Organize Lambda functions by domain:
- `auth-service`: Authentication related functions
- `product-service`: Product management
- `order-service`: Order processing
- `payment-service`: Payment processing
- `user-service`: User management

## 8. TypeScript Type Definitions

### 8.1 Core Entity Types

```typescript
// Example of TypeScript interfaces

// User entity
export interface User {
  id: string;
  email: string;
  password?: string; // Excluded from responses
  name: string;
  role: UserRole;
  createdAt: Date;
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

// Product entity
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  createdAt: Date;
}

// Order entity
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: Date;
  items?: OrderItem[];
  payment?: Payment;
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Order item entity
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

// Payment entity
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  providerTransactionId: string;
  createdAt: Date;
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

## 9. Security Considerations

### 9.1 Security Best Practices

1. **Data Validation**
   - Validate all input with Zod or Joi
   - Sanitize all data to prevent XSS attacks

2. **Authentication**
   - Store passwords using bcrypt with salt rounds ≥ 12
   - Implement rate limiting for login attempts
   - Use HTTP-only cookies for JWT storage when possible

3. **Authorization**
   - Implement role-based access control
   - Verify ownership of resources

4. **API Security**
   - Use HTTPS only
   - Implement CORS with proper origins
   - Add security headers (Helmet.js)

5. **Payment Security**
   - Never store raw credit card information
   - Use tokenization provided by Stripe/PayPal
   - Log payment attempts for audit trails

### 9.2 Example Security Implementation

```typescript
// Example Express app setup with security
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(express.json({ limit: '10kb' })); // Limit payload size

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL, // Your Angular app on Vercel
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', limiter); // Apply to auth routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

export default app;
```

## 10. Logging and Monitoring

### 10.1 Logging Strategy

```typescript
// Example Winston logger setup
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;
```

### 10.2 AWS CloudWatch Integration

Integrate with CloudWatch for centralized logging using the AWS SDK.

## 11. Implementation Roadmap

### 11.1 Phase 1: Foundation (Week 1-2)
- Set up TypeScript project with Express
- Configure AWS RDS PostgreSQL
- Implement database migrations and models
- Create authentication endpoints (signup, login)
- Set up basic CI/CD pipeline

### 11.2 Phase 2: Core Functionality (Week 3-4)
- Implement product endpoints
- Implement order management
- Create user profile management
- Add admin functionality

### 11.3 Phase 3: Payments & Integration (Week 5-6)
- Integrate Stripe payment
- Integrate PayPal payment
- Connect with Angular frontend
- Implement session management

### 11.4 Phase 4: Deployment & Testing (Week 7-8)
- Set up AWS Lambda functions
- Configure API Gateway
- Implement comprehensive testing
- Perform security audit
- Deploy to production

## 12. Frontend Integration

### 12.1 API Communication

The existing Angular frontend should communicate with the API using:
- Angular HttpClient module
- Interceptor for attaching JWT auth headers
- Interface types matching backend TypeScript types

### 12.2 Example Angular Service

```typescript
// Example Angular service for products
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Additional methods for CRUD operations
}
```

## 13. Testing Strategy

### 13.1 Unit Testing

Use Jest for unit testing:
- Controllers
- Services
- Middleware
- Utilities

### 13.2 Integration Testing

Test API endpoints with supertest:
- Authentication flows
- CRUD operations
- Payment processing
- Error handling

### 13.3 Example Test

```typescript
// Example Jest test for authentication
import request from 'supertest';
import app from '../src/app';
import { connectDB, closeDB } from '../src/database';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});

describe('Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toEqual('test@example.com');
  });
  
  // More test cases
});
```

## 14. Documentation

### 14.1 API Documentation

Use Swagger/OpenAPI for documenting API endpoints:

```typescript
// Example Swagger setup with express-swagger-generator
import express from 'express';
import expressSwagger from 'express-swagger-generator';

const app = express();

// Swagger configuration
const options = {
  swaggerDefinition: {
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'E-commerce API Documentation'
    },
    host: 'localhost:3000',
    basePath: '/api',
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Bearer token'
      }
    }
  },
  basedir: __dirname,
  files: ['./routes/**/*.ts', './models/**/*.ts']
};

expressSwagger(app)(options);

export default app;
```

## 15. Cost Optimization

### 15.1 AWS Free Tier Optimization

To ensure staying within AWS free tier:

1. **RDS**
   - Use t2.micro instance (750 hours/month free)
   - Set up automated backups to free S3
   - Monitor storage usage (20GB limit)

2. **Lambda**
   - Optimize function cold starts
   - Set memory allocation to minimum required
   - Cache database connections

3. **API Gateway**
   - Monitor request count (1M free per month)
   - Implement caching where appropriate

4. **S3**
   - Optimize image storage
   - Implement lifecycle policies
   - Consider image compression