# seller-service

Owns seller onboarding, profiles, and store management for the Bazaario platform.

**PostgreSQL schema:** `seller`  
**TCP port:** `3002` (`SELLER_SERVICE_TCP_PORT`)

## Responsibilities
- Seller registration and KYC
- Store profile management
- Seller dashboards and analytics
- Payout configuration

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env
npm run prisma:generate:seller-service
npm run prisma:migrate:seller-service
npm run start:seller-service
```

## First migration

```bash
npm run prisma:migrate:seller-service -- --name init
```
