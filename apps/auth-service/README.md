# auth-service

Owns authentication and session management for the Bazaario platform.

**PostgreSQL schema:** `auth`  
**TCP port:** `3001` (`AUTH_SERVICE_TCP_PORT`)

## Responsibilities
- User registration and login
- JWT issuance and refresh
- Session lifecycle management
- Password reset flows

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env   # fill in DATABASE_URL etc.
npm run prisma:generate:auth-service
npm run prisma:migrate:auth-service
npm run start:auth-service
```

## Run e2e tests

```bash
# Requires Postgres + Redis running (docker-compose up -d)
npx jest --config apps/auth-service/jest.config.ts
```

## First migration

```bash
npm run prisma:migrate:auth-service -- --name init
```

This creates `CREATE SCHEMA IF NOT EXISTS "auth"` and the `_prisma_migrations` tracking table.
