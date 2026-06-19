# E2E Testing

## Current Pack

- Auth flow: credential verification, refresh rotation, logout invalidation.
- Session flow: list active sessions and invalidate a specific session.
- Password reset flow: token expiry/one-time-use enforcement.
- 2FA flow: mock/dev challenge verification without real secrets.
- RBAC flow: Disponent, finance, warehouse, driver, support, compliance, super admin.
- Warehouse flow: pick, scan, pack, label, stage, ready.
- Driver flow: pickup proof, delivery proof, GPS tolerance.
- Tracking flow: append/timeline and immutable delete block.
- Escrow flow: blocked with active dispute, released only with proof/dispute clearance.
- Dispute flow: evidence required before resolution.
- AI flow: recommendation, risk classification, approval gate, prohibited-action block.
- Adapter flow: all provider integrations remain mock/dev.
- Observability flow: health, readiness, metrics-ready service.
- Queue flow: enqueue-only mock queue with no live worker startup.
- Webhook flow: HMAC signature verification design hook.

## Disposable PostgreSQL Setup

Use `TEST_DATABASE_URL` from `.env.example` for disposable database runs. The intended production-style sequence is:

```bash
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
DATABASE_URL=$TEST_DATABASE_URL npm run seed
DATABASE_URL=$TEST_DATABASE_URL npm test -- --runInBand
```

Shortcut:

```bash
TEST_DATABASE_URL=postgresql://<test_db_user>:<test_db_password>@localhost:5432/logistics_os_test npm run test:postgres
```

Rollback/reset-safe development workflow:

```bash
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate reset --force
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
DATABASE_URL=$TEST_DATABASE_URL npm run seed
```

Never point reset commands at production. Production rollback requires restoring a verified backup and applying a forward correction migration.
