# catalog-service

Owns product catalogue, categories, and inventory for the Bazaario platform.

**PostgreSQL schema:** `catalog`  
**TCP port:** `3003` (`CATALOG_SERVICE_TCP_PORT`)

## Responsibilities
- Product CRUD and versioning
- Category and attribute management
- Inventory tracking per SKU
- Search indexing triggers

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env
npm run prisma:generate:catalog-service
npm run prisma:migrate:catalog-service
npm run start:catalog-service
```

## First migration

```bash
npm run prisma:migrate:catalog-service -- --name init
```
