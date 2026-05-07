# order-service

Owns order lifecycle management for the Bazaario platform.

**PostgreSQL schema:** `order`  
**TCP port:** `3004` (`ORDER_SERVICE_TCP_PORT`)

## Responsibilities
- Cart and checkout orchestration
- Order state machine (placed → confirmed → shipped → delivered)
- Returns and cancellations
- Order history

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env
npm run prisma:generate:order-service
npm run prisma:migrate:order-service
npm run start:order-service
```

## First migration

```bash
npm run prisma:migrate:order-service -- --name init
```
