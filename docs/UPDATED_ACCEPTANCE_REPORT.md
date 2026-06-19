# Updated Acceptance Report

## Integration 7D Failed-Call Elimination Pass

Status: first 7D repair pass implemented and smoke-verified against the public mock/dev API.

### Online Pattern Applied

- NestJS DTO classes remain the source for both validation and Swagger/OpenAPI request schemas.
- Prisma/runtime reference errors are converted at the controller boundary into standard `400 ContractMismatch` envelopes.
- RBAC remains guard-based; dev actor headers are normalized but not treated as production identity.
- CORS remains explicit for frontend dev origins and required headers.

### 7C Report Availability

`integration-milestone-7c-report.md` was not present in the backend checkout, Git history, or local workspace search. The failure table below is reconstructed from the Codex 7C summary, active OpenAPI routes, public smoke calls, and backend logs.

### Failure Table

| Workflow | Role/user | Method | Endpoint | Request body / headers | Expected | Actual before 7D | Response / backend error | Root cause | Fix applied |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shipment creation | `merchant` dev actor | `POST` | `/shipments` | `{ "orderId": "...", "barcode": "..." }`, `x-actor-id`, `x-actor-roles` | `201` for valid order, clean `400` for bad order | `500` | `HTTP_500`, Prisma FK/runtime error | Inline body had no DTO/schema and Prisma create errors were uncaught | Added `CreateShipmentDto`, Swagger request schema, barcode alias support, and `400 ContractMismatch` catch |
| Shipment creation validation | `merchant` dev actor | `POST` | `/shipments` | unknown/missing order reference | clean `400` | `500` | Internal server error | FK mismatch leaked through Nest exception layer | Regression test added for FK failure envelope |
| Warehouse payload aliases | `warehouse_staff` / `warehouse_manager` | `POST` | `/warehouse/*` | `{ "id": "pkg" }` or `{ "barcode": "pkg" }` | `201` for valid flow | likely `400` DTO mismatch | validation error | DTO required only `packageId` | `WarehousePackageDto` now supports `packageId`, `id`, or `barcode`; controller enforces one-of with `ContractMismatch` |
| Driver delivery GPS aliases | `driver` | `POST` | `/driver/delivery/:shipmentId/complete`, `/drivers/delivery/:shipmentId/complete`, `/shipments/:id/deliver` | GPS may include `lat`/`lng` | `201` when proof policy passes | likely `400` DTO mismatch | validation error | DTO only accepted `latitude`/`longitude` | GPS DTO accepts `lat`/`lng`; controllers normalize to `latitude`/`longitude` before policy checks |
| Dev actor RBAC headers | all workflow roles | all protected endpoints | protected routes | `x-actor-roles` as comma list or JSON array | allowed role should pass | likely `403` on JSON/header aliases | RBAC denied | guard only split comma string and did not normalize aliases | Dev roles now parse comma or JSON array and normalize documented aliases (`admin`, `disponent`, `warehouse`, `finance`, `compliance`, `ai`) |
| CORS preflight | frontend dev | `OPTIONS` | `/ai/providers/:id/test` | `Authorization`, `Content-Type`, `x-actor-id`, `x-actor-roles`, `x-actor-permissions` | `204` | fixed in 7C | no current failure | CORS already repaired | Reverified public preflight in 7D |
| Tunnel stability | public mock API | `GET` | `/health` | `bypass-tunnel-reminder: true` for localtunnel smoke | `200` | timeout entries in 7C | localtunnel 408/502 when stale tunnel died | stale localtunnel agent/subdomain instability | Restarted API/tunnel with fresh public URL and verified health/preflight/shipment calls |

### 7D Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test -- --runInBand`: passed, 6 suites, 47 tests, 1 skipped suite.
- `npm run build`: passed.
- `npm run openapi:export`: passed.
- Public smoke URL: `https://social-tigers-throw.loca.lt`
- Public health smoke: `200 OK`.
- Public CORS preflight for `POST /ai/providers/dev-provider-001/test`: `204 No Content`.
- Public `POST /shipments` invalid order smoke: `400 ContractMismatch`, not `500`.
- Public `POST /shipments` valid seeded order smoke: `201 Created`.

### Remaining Notes

- Exact 31-call Codex report is still required to mark all previous failed calls definitively fixed one by one.
- Live provider calls, live payments, live logistics bookings, production workers, and production deployment remain blocked by design.
- Current public localtunnel URL changed because the previous named subdomain did not reconnect cleanly.

## Integration 7C Backend Contract Repair

Status: backend contract repair implemented for real frontend-to-backend rerun.

### Repaired

- Explicit CORS configuration added for frontend dev origins, `OPTIONS`, and headers `Authorization`, `Content-Type`, `x-actor-id`, `x-actor-roles`, `x-actor-permissions`, and `x-correlation-id`.
- DTO-backed validation added or tightened for auth/session/2FA, order items, dispatch assignment, returns, approval decisions, refund approval comments, and AI provider test payloads.
- Dispatch driver assignment now defaults missing `packageStatus` to `ready_for_dispatch` while preserving the policy block for non-ready packages.
- Prisma reference failures in order creation, return creation/status update, dispatch assignment creation, and driver job updates now return clean `400 ContractMismatch` envelopes.
- Regression coverage added in `test/integration-7c-contract-repair.spec.ts` for order confirm, warehouse scan/pack/ready, dispatch assignment, pickup complete, shipment deliver, escrow release, refund approval, AI approval, AI provider test, auth/session/2FA, and CORS preflight.

### Still Mock/Dev Only

- AI provider testing does not perform a live provider call.
- Payments, escrow, carrier/logistics, messaging, KYC, ERP, and queues remain mock/dev only.
- RBAC and approval gates remain enabled.
- Production deployment remains blocked.

Milestone 5 status: production-readiness hardening and E2E verification completed for controlled development use.

## Completed

- Auth hardening: bcrypt credential verification, JWT access token issue, refresh-token persistence, rotation, logout invalidation, 2FA-ready setup, password reset-ready flow.
- Session management: session listing and session invalidation endpoints added.
- Password reset enforcement: expiry, one-time-use, and active-session revocation covered by tests.
- Mock/dev 2FA verification: challenge setup and verification interface added without real secrets.
- In-process rate limiting added for auth, password reset, AI, tracking, document upload-reference, provider test, and driver location endpoints.
- Observability foundation added: correlation ID middleware, structured logging-ready service, `/health`, `/readiness`, and `/metrics`.
- Redis/BullMQ readiness added as enqueue-only queue contracts with no live workers or polling loops.
- Database-backed paths added where possible: orders, shipments, packages, warehouse package events, dispatch assignments, Disponent tour plans, driver jobs, tracking events, disputes, returns, notifications, AI recommendations, approval requests.
- External provider adapter boundary added with mock/dev implementations for storage, payments, maps/GPS, messaging, KYC, carrier APIs, ERP/accounting, and webhook signature verification design.
- Data-retention policy added for audit, proof/evidence, personal data, finance/ledger, and GDPR readiness.
- Regression tests expanded to include Milestone 5 auth/session/reset/2FA/rate-limit/observability/queue/webhook readiness.
- OpenAPI export remains available at `docs/openapi/openapi.json`.

## Verification

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 4 suites, 37 tests.
- `npm run openapi:export`: passed.
- Disposable PostgreSQL migrations: passed, 2 migrations applied.
- Seed script against disposable PostgreSQL: passed.
- Prisma client real DB query: passed with seeded users, roles, and shipment.
- Reset-safe dev workflow: `prisma migrate reset --force --skip-seed` passed on disposable database.
- `npm run test:postgres`: passed against disposable PostgreSQL.

## Decision

- Frontend integration can continue safely using mock adapters and protected endpoints.
- Production deployment remains blocked until real secrets, live provider contracts, Redis-backed rate limiting, production observability/exporters, legal retention approval, and approved deployment runbooks are complete.
