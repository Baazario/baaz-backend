# logistics-service

Owns shipment tracking and delivery management for the Bazaario platform.

**PostgreSQL schema:** `logistics`  
**TCP port:** `3006` (`LOGISTICS_SERVICE_TCP_PORT`)

## Responsibilities
- Carrier integration and label generation
- Shipment status tracking
- Delivery SLA management
- Address validation

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env
npm run prisma:generate:logistics-service
npm run prisma:migrate:logistics-service
npm run start:logistics-service
```

## First migration

```bash
npm run prisma:migrate:logistics-service -- --name init
```
