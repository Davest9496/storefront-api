# Storefront API

A RESTful e-commerce backend API built with TypeScript, Express, and PostgreSQL, designed to connect with an Angular frontend deployed on Vercel.

![CI Pipeline](https://github.com/davest9496/storefront-api/actions/workflows/ci.yml/badge.svg)

## 📋 Features

- **User Authentication**: JWT-based authentication with signup, login, and session management
- **Product Management**: CRUD operations for products with categories and search functionality
- **Order Processing**: Shopping cart management, checkout, and order tracking
- **Payment Integration**: Secure payment processing with Stripe and PayPal
- **AWS Deployment**: Optimized for AWS free tier with serverless architecture
- **Database**: PostgreSQL on AWS RDS (free tier)
- **TypeScript**: Strict typing for improved code quality and developer experience
- **Comprehensive Testing**: Unit and integration tests with Jest
- **API Documentation**: Interactive API documentation with Swagger/OpenAPI

## 🔧 Technologies

- **Language**: TypeScript with strict typing
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL on AWS RDS
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting**: AWS Lambda + API Gateway (free tier)
- **Payment Processing**: Stripe and PayPal SDK integration
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Testing**: Jest
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
src/
├── app.ts           // Express app configuration
├── server.ts        // Server initialization and startup
├── controllers/     // Route handlers
├── entities/        // TypeORM entities
├── routes/          // API route definitions
├── services/        // Business logic
├── middleware/      // Custom middleware
├── utils/           // Helper functions
├── types/           // TypeScript type definitions
├── config/          // Configuration files
├── scripts/         // Utility scripts
├── migrations/      // Database migrations
└── __tests__/       // Test files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/storefront-api.git
   cd storefront-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:

   ```bash
   npm run db:setup
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Access the API at `http://localhost:3000/api`
   - API Documentation: `http://localhost:3000/api/api-docs`
   - Health Check: `http://localhost:3000/api/health`

## 🧪 Testing

Run tests with the following commands:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth.test.ts
```

## 📦 Build

Build the project for production:

```bash
npm run build
```

The compiled JavaScript will be in the `dist` directory.

## 🌐 API Documentation

The API is documented using Swagger/OpenAPI. Access the documentation at `/api/api-docs` when the server is running.

### Key Endpoints

- **Authentication**

  - POST `/api/auth/signup` - Register a new user
  - POST `/api/auth/login` - Login a user
  - POST `/api/auth/logout` - Logout a user
  - GET `/api/auth/me` - Get current user information

- **Products**

  - GET `/api/products` - Get all products
  - GET `/api/products/:id` - Get a specific product
  - POST `/api/products` - Create a product (admin)
  - PUT `/api/products/:id` - Update a product (admin)
  - DELETE `/api/products/:id` - Delete a product (admin)

- **Orders**

  - GET `/api/orders` - Get user's orders
  - GET `/api/orders/:id` - Get a specific order
  - POST `/api/orders` - Create a new order
  - PATCH `/api/orders/:id` - Update order status (admin)

- **Payments**
  - POST `/api/payments/stripe` - Process Stripe payment
  - POST `/api/payments/paypal` - Process PayPal payment
  - GET `/api/payments/:id` - Get payment information

## 🚢 Deployment

### AWS Deployment (Free Tier)

This project is optimized for deployment on AWS free tier with the following components:

1. **AWS RDS PostgreSQL**:

   - t2.micro instance
   - 20GB storage
   - Configure with secure networking

2. **AWS Lambda + API Gateway**:

   - Serverless API endpoints
   - 1 million free requests per month
   - Optimized for minimal cold starts

3. **AWS S3**:

   - Storage for product images
   - Configure with lifecycle policies

4. **AWS CloudWatch**:
   - Basic monitoring
   - Log management

A CI/CD pipeline using GitHub Actions is included to automatically build, test, and deploy the application to AWS.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
