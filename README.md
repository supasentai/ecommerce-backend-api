# E-commerce API

[![CI](https://github.com/supasentai/ecommerce-backend-api/actions/workflows/ci.yml/badge.svg)](https://github.com/supasentai/ecommerce-backend-api/actions/workflows/ci.yml)

## 1. Project Overview

E-commerce API is a production-style backend project built with NestJS,
TypeScript, Prisma, and PostgreSQL. It models the core workflows of an online
store, including authentication, role-based administration, product catalog
management, cart operations, checkout, order tracking, cancellation, and stock
restoration.

The project is designed as a portfolio-ready backend codebase that demonstrates
REST API design, modular architecture, transactional business logic, validation,
error handling, automated tests, and developer-friendly documentation.

## 2. Features

- User registration and login
- JWT-based authentication
- Rate limiting for authentication endpoints
- Password hashing with bcrypt
- Profile update and password change endpoints
- Role-based access control for `USER` and `ADMIN`
- Admin user listing, lookup, role update, and deletion
- Category CRUD
- Product CRUD
- Public product and category listing
- Standardized list pagination metadata
- Product search, filtering, sorting, and pagination
- Current-user cart management
- Cart item create, update, remove, and clear operations
- Checkout from cart
- Order item price snapshots
- Atomic stock decrement during checkout
- User order history and order detail
- Admin order listing, detail, and status updates
- Order filtering and sorting for user/admin lists
- User cancellation for pending orders
- Atomic stock restoration when an order is cancelled
- Standard success response interceptor
- Centralized HTTP exception formatting
- Unit tests and e2e tests
- Swagger documentation
- Postman collection
- ERD documentation

## 3. Tech Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Passport JWT
- `@nestjs/jwt`
- `@nestjs/throttler`
- bcrypt
- class-validator
- class-transformer
- Jest
- Supertest
- Docker Compose
- Swagger/OpenAPI

## 4. Architecture

The application follows a modular NestJS structure. Each domain module owns its
controller, service, DTOs, and tests.

- Controllers define HTTP routes and delegate work to services.
- Services contain business logic and Prisma database operations.
- DTOs validate request bodies and query parameters.
- Guards enforce JWT authentication and role-based authorization.
- Decorators keep role requirements declarative.
- Filters normalize error responses.
- Interceptors wrap successful responses consistently.
- Prisma defines the data model and database relations.

Main modules:

- `AuthModule`: registration, login, profile, and password management
- `UsersModule`: admin user management
- `CategoriesModule`: category CRUD and listing
- `ProductsModule`: product CRUD, listing, search, and filters
- `CartModule`: current-user cart operations
- `OrdersModule`: checkout, order history, admin order management, cancellation

## 5. Database Schema Overview

The Prisma schema contains the core e-commerce entities:

- `User`: stores account data, password hash, role, cart items, and orders
- `Category`: groups products and uses a unique slug
- `Product`: stores catalog data, price, stock, active status, and category
- `CartItem`: connects a user to a product with a selected quantity
- `Order`: stores order ownership, status, and total amount
- `OrderItem`: stores order line items with quantity and snapshot price

Enums:

- `Role`: `USER`, `ADMIN`
- `OrderStatus`: `PENDING`, `PAID`, `SHIPPED`, `COMPLETED`, `CANCELLED`

Important relationships:

- A user can have many cart items.
- A user can place many orders.
- A category can contain many products.
- A product can appear in many cart items.
- An order can contain many order items.
- A product can appear in many order items.

## 6. ERD

The ERD is stored in the `docs/` folder:

- [Mermaid ERD source](docs/ecommerce-erd.mmd)
- [SVG ERD diagram](docs/ecommerce-erd.svg)

![E-commerce API ERD](docs/ecommerce-erd.svg)

## 7. Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your local database URL and a strong JWT secret:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET=replace_with_a_strong_secret
```

Start only the local PostgreSQL database for host-based development:

```bash
docker compose up -d postgres
```

If port `5432` is already in use, choose another host port:

```bash
POSTGRES_PORT=5433 docker compose up -d postgres
```

Run database migrations and generate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

Seed demo data:

```bash
npm run seed
```

Demo accounts use the password `Password123!`:

- Admin: `admin@example.com`
- User: `user1@example.com`
- User: `user2@example.com`

## 8. Environment Variables

The application validates environment variables at startup and fails fast when
required values are missing.

Create `.env` from the example file:

```bash
cp .env.example .env
```

Environment variables:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

Required:

- `DATABASE_URL`
- `JWT_SECRET`

Defaults:

- `PORT`: `3000`
- `JWT_EXPIRES_IN`: `7d`

## 9. Running Locally

Start the API in development mode:

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3000
```

Useful local database commands:

```bash
docker compose up -d postgres
docker compose down
docker compose down -v
```

The host PostgreSQL port defaults to `5432`. Override it with `POSTGRES_PORT`
when needed:

```bash
POSTGRES_PORT=5433 docker compose up -d postgres
```

The Docker Compose setup starts PostgreSQL 16 on port `5432` with:

- Database: `ecommerce_db`
- Username: `postgres`
- Password: `postgres`

After migrations, seed local demo users, categories, and products:

```bash
npm run seed
```

Demo accounts:

- Admin: `admin@example.com` / `Password123!`
- User: `user1@example.com` / `Password123!`
- User: `user2@example.com` / `Password123!`

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

If host port `3000` is already in use, choose another API port:

```bash
API_PORT=3001 docker compose up --build
```

The API container runs migrations before starting. In Docker Compose,
`DATABASE_URL` points to the `postgres` service:

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ecommerce_db?schema=public"
```

Swagger is available at:

```text
http://localhost:3000/api/docs
```

## 10. Running Tests

Run unit tests:

```bash
npm test
```

Run e2e tests:

```bash
npm run test:e2e
```

Run the TypeScript build:

```bash
npm run build
```

## 11. API Documentation

Swagger UI is available after starting the application:

```text
http://localhost:3000/api/docs
```

Swagger is organized with these API tags:

- Auth
- Users
- Categories
- Products
- Cart
- Orders

Bearer authentication is enabled in Swagger. Log in through `POST /auth/login`,
copy the returned `accessToken`, then authorize with:

```text
Bearer <accessToken>
```

Auth endpoints are rate limited to reduce brute-force and token abuse:

- Global default: 100 requests per 60 seconds
- `POST /auth/register`: 5 requests per 60 seconds
- `POST /auth/login`: 5 requests per 60 seconds
- `POST /auth/refresh`: 10 requests per 60 seconds

When a client exceeds the configured limit, the API returns `429 Too Many
Requests` using the standard error response format.

## 12. Postman Collection

The Postman collection is available at:

```text
docs/ecommerce-api.postman_collection.json
```

Collection variables:

- `baseUrl`: API base URL, default `http://localhost:3000`
- `token`: JWT for a regular user
- `adminToken`: JWT for an admin user
- `userId`: user resource ID
- `categoryId`: category resource ID
- `productId`: product resource ID
- `cartItemId`: cart item resource ID
- `orderId`: order resource ID

Collection folders:

- Auth
- Users
- Categories
- Products
- Cart
- Orders
- Admin Orders

## 13. Folder Structure

```text
ecommerce-api/
|-- docs/
|   |-- ecommerce-api.postman_collection.json
|   |-- ecommerce-erd.mmd
|   `-- ecommerce-erd.svg
|-- prisma/
|   `-- schema.prisma
|-- src/
|   |-- common/
|   |   |-- decorators/
|   |   |-- filters/
|   |   |-- guards/
|   |   `-- interceptors/
|   |-- modules/
|   |   |-- auth/
|   |   |-- cart/
|   |   |-- categories/
|   |   |-- orders/
|   |   |-- products/
|   |   `-- users/
|   |-- prisma/
|   |-- app.module.ts
|   `-- main.ts
|-- test/
|   `-- app.e2e-spec.ts
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## 14. Core API Flow

1. Register a user with `POST /auth/register`.
2. Log in with `POST /auth/login` and store the JWT.
3. Browse categories and products.
4. Add an active product to the current user's cart.
5. Checkout the cart to create a pending order.
6. View current-user order history.
7. Open a specific order detail.
8. Cancel a pending order when needed.
9. Use an admin account to manage users, catalog records, and order status.

## 15. Fullstack Roadmap

This backend API is designed to be integrated with a dedicated Next.js frontend.

Frontend repository: Coming soon

Planned frontend stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form + Zod

Planned frontend features:

- Product listing and product detail pages
- Authentication pages
- Shopping cart
- Checkout flow
- User order history
- Admin dashboard for products, categories, orders, and users
