# payment-service

Owns payment processing and financial records for the Bazaario platform.

**PostgreSQL schema:** `payment`  
**TCP port:** `3005` (`PAYMENT_SERVICE_TCP_PORT`)

**All monetary values are stored as paise (bigint). Never use floats.**

## Responsibilities
- Payment gateway integration
- Transaction lifecycle (initiated → captured → settled)
- Refund processing
- Seller payout disbursement

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env
npm run prisma:generate:payment-service
npm run prisma:migrate:payment-service
npm run start:payment-service
```

## First migration

```bash
npm run prisma:migrate:payment-service -- --name init
```
