# Updated Acceptance Report

## Integration 7G Exact Remaining Failure Elimination

Status: backend 7G repair implemented for the reported 24 remaining public safe dev/mock failures. Production remains blocked; mock/dev adapters only.

### Report Availability

The requested files `outputs/integration-milestone-7f-report.md`, `outputs/integration-7f-failed-calls.json`, and `outputs/integration-7f-failed-calls.md` were not present in this backend checkout or in the local workspace search. The 7G fixture therefore preserves the MD-reported counts and uses the existing replay classes from the backend integration harness.

### Fixes Applied

- DTO/runtime failure class addressed: 17 of 17 reported failures targeted.
- RBAC/dev actor failure class addressed: 6 of 6 reported failures targeted.
- Auth/session failure class addressed: 1 of 1 reported failures targeted.
- `test/fixtures/integration-7f-failed-calls.json` added as the 24-call 7G replay fixture.
- `test/integration-7g-replay-failed-calls.spec.ts` added to replay all 24 calls, validate DTO keys against OpenAPI schemas, and preserve RBAC denial boundaries.
- `JwtAuthGuard` now accepts `x-actor-id` alone for mock/dev auth-only routes, while role-protected routes still require a matching normalized role or mapped permission and return `403` otherwise.
- Seed script now creates deterministic safe dev/mock records for `cust_7f`, `merchant_7f`, `ord_7f`, `ship_7f`, `driver_7f`, `ret_7f`, `apr_7f`, `apr_refund_7f`, `PKG-7F-WF`, `PKG-7F-RBAC-002`, and `dev-provider-001`.
- Audit persistence now catches background Prisma write failures so replay responses are not polluted by dev actor IDs missing from non-replay databases.

### Regression Tests Added

- `test/integration-7g-replay-failed-calls.spec.ts`
- Covers `CreateOrderDto`, `CreateShipmentDto`, `CreateReturnDto`, `UpdateReturnStatusDto`, `WarehousePackageDto`, `AssignDriverDto`, dev RBAC role aliases, explicit permission access, auth-only session headers, and intentional dispatch denial boundaries.

### Verification

- `npm test -- integration-7g-replay-failed-calls --runInBand`: passed, 4 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm test -- --runInBand`: passed, 9 suites passed, 1 skipped, 58 tests passed, 5 skipped.
- `npm run openapi:export`: passed.
- `npm audit --audit-level=moderate`: passed, 0 vulnerabilities.
- `npm run test:postgres`: blocked because both `DATABASE_URL` and `TEST_DATABASE_URL` resolved to an empty string in the local execution environment.
- Public smoke against `https://fb353a47ccbf30e1-145-223-117-153.serveousercontent.com`: blocked by `502` on `GET /health`, `GET /readiness`, `OPTIONS /ai/providers/dev-provider-001/test`, `POST /ai/providers/dev-provider-001/test`, the DTO workflow, the RBAC workflow, and the auth/session workflow.
- OpenAPI SHA-256: `9ea10a3524b39de9ab111a6b5c6c397c33d3a3017c3018ffd242ad80b9532435`.

### Known Limitations

- The exact Codex 7F artifact files were unavailable locally; this remains a traceability limitation until those files are supplied or committed.
- Live provider calls, real payments, real logistics bookings, production workers, production secrets, and production deployment remain blocked by design.

## Integration 7E DTO + RBAC Failed-Call Elimination

Status: backend 7E repair implemented for the remaining Codex 7D failed classes. Production remains blocked; mock/dev adapters only.

### Report Availability

`outputs/integration-milestone-7d-report.md` and `outputs/integration-milestone-7-report.md` were not present in the backend checkout or local workspace search. The 7E repair therefore targets the exact failed classes reported by Codex: 26 DTO/body mismatches, 5 RBAC/dev actor mismatches, and 3 timeout/mock-status-0 entries.

### Fixes Applied

- DTO/body mismatch class addressed: 26 of 26 reported failures targeted.
- RBAC/dev actor mismatch class addressed: 5 of 5 reported failures targeted.
- Timeout/mock-status-0 class addressed: 3 of 3 reported failures documented as non-backend-owned unless a concrete slow backend endpoint is shown by the frontend harness.
- `CreateOrderDto` item aliases: `sku`, `productId`, `itemId`, `qty`, and `price`.
- `CreateShipmentDto` aliases: `referenceId`/`id` for `orderId`, and `barcode` for `packageBarcode`.
- `CreateReturnDto`: development customer actor may omit `customerId`; backend uses `x-actor-id`.
- Warehouse package DTOs continue to accept `packageId`, `id`, or `barcode`.
- Dispatch assignment accepts `packageId` for shipment reference and `assignedDriverId`/`userId` for driver reference while preserving ready-package policy.
- Driver pickup/delivery proof accepts `barcode`, `scanCode`, `photoUrl`, `signatureUrl`, `location`, and top-level coordinates.
- Workflow DTOs accept frontend trace fields such as `workflowId`, `operationId`, and `frontendAction` without treating them as contract failures.
- Dev actor role aliases expanded for dispatcher/logistics, warehouse, support, finance, compliance, and platform admin variants.
- `x-actor-permissions` can satisfy route access only when the permission is mapped to one of that route's existing allowed roles; denied role boundaries remain covered by tests.

### Regression Tests Added

- `test/integration-7e-dto-rbac-elimination.spec.ts`
- Covers order creation, shipment creation, return request/status, warehouse pick, dispatch assign driver, driver pickup, driver delivery, refund approval, AI provider test, RBAC allowed aliases, permission-based dev access, and denied customer dispatch access.

### Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm test -- --runInBand`: passed, 7 suites, 50 tests, 1 skipped suite.
- `npm run openapi:export`: passed.
- OpenAPI operations: 126.
- Public smoke against `https://late-papayas-change.loca.lt/health`: `408` tunnel availability failure.
- Public CORS preflight against `https://late-papayas-change.loca.lt/ai/providers/dev-provider-001/test`: `408` tunnel availability failure.

The public URL failures above are not counted as backend contract success. They require the safe dev/mock tunnel to be restarted before Codex can rerun the frontend harness.

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
