# Baazario Backend

NestJS monorepo powering the Baazario e-commerce platform. One codebase, eight independently deployable services.

## Architecture

```
                        ┌─────────────────────┐
                        │     API Gateway      │
   HTTP :3000  ────────►│  JWT · Rate Limit   │
                        │  CORS · Logging      │
                        └──────────┬──────────┘
                                   │ TCP
              ┌────────────────────┼────────────────────┐
              │            ┌───────┼───────┐            │
              ▼            ▼       ▼       ▼            ▼
         auth-service  seller  catalog  order  payment  logistics  notification
           :3001        :3002   :3003   :3004   :3005    :3006       :3007
```

Each microservice is a pure TCP listener with its own PostgreSQL schema and Prisma client.

## Services

| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Public HTTP entry point — JWT, rate limiting, CORS, request routing |
| auth-service | 3001 | User accounts, authentication, token issuance |
| seller-service | 3002 | Seller onboarding, profiles, KYC |
| catalog-service | 3003 | Products, categories, inventory |
| order-service | 3004 | Order lifecycle management |
| payment-service | 3005 | Payment processing, refunds |
| logistics-service | 3006 | Shipments, tracking, delivery |
| notification-service | 3007 | Email, SMS, push notifications |

## Shared Library

`libs/common` is imported by every service and provides:

- `AllExceptionsFilter` — context-aware (HTTP + RPC) error handling
- `LoggingInterceptor` — structured request/response logging
- `ResponseInterceptor` — wraps HTTP responses in `{ success, data, timestamp }`
- `TraceIdMiddleware` — injects `x-trace-id` on every request
- `AppException` / `ErrorCode` — typed domain exceptions
- `Money` — paise-based arithmetic utilities (no floats)
- `envValidationSchema` — Joi schema for env var validation
- `buildLoggerOptions` — pino-pretty in dev, JSON in prod

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Generate Prisma clients (run once, then after schema changes)
npm run prisma:generate:auth-service
npm run prisma:generate:seller-service
# ... repeat for each service

# 4. Run migrations
npm run prisma:migrate:auth-service
# ... repeat for each service

# 5. Start services (each in a separate terminal)
npm run start:api-gateway
npm run start:auth-service
npm run start:seller-service
npm run start:catalog-service
npm run start:order-service
npm run start:payment-service
npm run start:logistics-service
npm run start:notification-service
```

## Health Checks

Once the gateway is running, check any service over HTTP:

```bash
# All services at once
GET http://localhost:3000/health/services

# Individual service
GET http://localhost:3000/health/services/auth
GET http://localhost:3000/health/services/seller
GET http://localhost:3000/health/services/catalog
GET http://localhost:3000/health/services/order
GET http://localhost:3000/health/services/payment
GET http://localhost:3000/health/services/logistics
GET http://localhost:3000/health/services/notification
```

Response:
```json
{
  "status": "ok",
  "checks": { "db": true, "redis": true },
  "service": "auth-service",
  "timestamp": "2026-05-07T10:00:00.000Z"
}
```

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `JWT_SECRET` | Secret for signing JWTs |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `API_GATEWAY_PORT` | Gateway HTTP port (default 3000) |
| `AUTH_SERVICE_TCP_PORT` | Auth service TCP port (default 3001) |

## Project Structure

```
baaz-backend/
├── apps/
│   ├── api-gateway/          # HTTP entry point
│   ├── auth-service/
│   ├── seller-service/
│   ├── catalog-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── logistics-service/
│   └── notification-service/
├── libs/
│   └── common/               # Shared guards, filters, interceptors, utils
├── .env.example
├── nest-cli.json
└── package.json
```

Each service follows the same internal structure:

```
apps/<service>/
├── prisma/schema.prisma      # Service-owned DB schema
├── src/
│   ├── health/               # TCP health check handler
│   ├── prisma/               # PrismaService
│   ├── app.module.ts
│   └── main.ts
└── test/health.e2e-spec.ts
```

## Scripts

```bash
npm run build:all             # Build all services
npm run lint                  # ESLint with auto-fix
npm run test                  # Unit tests
npm run test:cov              # Coverage (threshold: 70%)
```
