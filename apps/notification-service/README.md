# notification-service

Owns all outbound notifications for the Bazaario platform.

**PostgreSQL schema:** `notification`  
**TCP port:** `3007` (`NOTIFICATION_SERVICE_TCP_PORT`)

## Responsibilities
- Email delivery (transactional + marketing)
- SMS and push notifications
- Notification templates and preferences
- Delivery status tracking

## TCP Message Patterns

| Pattern | Payload | Response |
|---|---|---|
| `{ cmd: 'health.check' }` | `{}` | `{ status, checks, service, timestamp }` |

_Business patterns are added per sprint._

## Run locally

```bash
cp ../../.env.example ../../.env
npm run prisma:generate:notification-service
npm run prisma:migrate:notification-service
npm run start:notification-service
```

## First migration

```bash
npm run prisma:migrate:notification-service -- --name init
```
