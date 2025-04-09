# storefront-api

This project is a TypeScript-based E-commerce API designed to be deployed on AWS within the free tier limits. It connects to an Angular frontend deployed on Vercel.

## Project Status

Phase 1: Day 5 - Express Application Setup Completed ✅

## Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL on AWS RDS
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting**: AWS Lambda + API Gateway (planned)
- **Payment Processing**: Stripe and PayPal SDKs (to be implemented)
- **Logging**: Winston
- **Testing**: Jest (to be implemented)
- **CI/CD**: GitHub Actions (to be implemented)

## Project Structure

```
/src
  /config         # Configuration files
  /controllers    # Route handlers
  /entities       # TypeORM entities
  /middleware     # Custom middleware
  /migrations     # Database migrations
  /repositories   # TypeORM repositories
  /routes         # API route definitions
  /scripts        # Utility scripts
  /services       # Business logic
  /types          # TypeScript type definitions
  /utils          # Helper functions
  app.ts          # Express app configuration
  server.ts       # Server initialization
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Set up the database:
   ```
   npm run db:setup
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Available Scripts

- `npm run build` - Build the project
- `npm run start` - Start the production server
- `npm run dev` - Start the development server
- `npm run lint` - Run ESLint
- `npm run db:setup` - Set up the database
- `npm run db:seed` - Seed the database with sample data
- `npm run migration:run` - Run database migrations
- `npm test` - Run tests

## API Documentation

API documentation is available at `/api-docs` when the server is running.

### Core Endpoints

- **Health Check**: GET `/health`
- **Authentication**: (to be implemented)
  - Register: POST `/api/auth/signup`
  - Login: POST `/api/auth/login`
  - Logout: POST `/api/auth/logout`
- **Products**: (to be implemented)
  - Get all products: GET `/api/products`
  - Get product by ID: GET `/api/products/:id`
- **Orders**: (to be implemented)
  - Create order: POST `/api/orders`
  - Get user orders: GET `/api/orders`
- **Payments**: (to be implemented)
  - Process payment: POST `/api/payments/stripe` or `/api/payments/paypal`

## Security Features

- CORS configuration for frontend integration
- Helmet for security headers
- Rate limiting to prevent abuse
- JWT authentication for protected routes
- Input validation (to be implemented)
- Error handling middleware

## Deployment

The API will be deployed on AWS using:
- AWS Lambda for serverless functions
- API Gateway for REST API endpoints
- RDS PostgreSQL for database
- S3 for storage (if needed)
- CloudWatch for logging and monitoring

## License

MIT