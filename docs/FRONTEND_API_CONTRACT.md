# Codey Frontend API Contract Notes

Status: Milestone 6 release-candidate contract frozen for Codey/frontend integration.

## API Version Marker

- API version: `0.1.0-rc.1`
- Contract status: `release_candidate`
- Runtime marker: `GET /meta/version`
- Contract marker: `GET /meta/contract`
- Breaking-change policy: no documented request/response shape changes without a new API version marker, updated OpenAPI export, updated frontend docs, and migration notes.

## Auth Flow

Development auth accepts actor headers for integration testing:

- `x-actor-id`
- optional `x-actor-roles`
- optional `x-actor-permissions`

Integration tests may use either Bearer JWT auth from `POST /auth/login` or dev actor headers. Dev actor headers are accepted only as a development/mock integration mechanism and must not be enabled as a production identity boundary without a separate gateway control.

For routes that require only authentication and no role metadata, `x-actor-id` alone is sufficient in the mock/dev backend. Routes protected with `@Roles(...)` still require a matching normalized role or mapped permission; an actor id with no matching role receives `403 RBAC_PERMISSION_DENIED`.

`x-actor-roles` may be sent as a comma-separated string such as `merchant,warehouse_staff` or as a JSON array string such as `["merchant"]`. The backend normalizes documented development aliases including `admin`, `superadmin`, `dispatcher`, `disponent`, `logistics_dispatcher`, `warehouse`, `warehouse_operator`, `warehouse_supervisor`, `support`, `finance`, `compliance`, and `ai`.

`x-actor-permissions` may be sent without `x-actor-roles` for development harness calls. A route still passes only when the supplied permission is explicitly mapped to one of that route's allowed roles, or when `*` is supplied by a trusted development actor. This does not weaken the endpoint role matrix.

## CORS For Frontend Dev

The safe dev/mock API allows browser preflight for frontend development origins configured through `CORS_ORIGIN`.

Required preflight support:

- Methods: `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Headers: `Authorization`, `Content-Type`, `x-actor-id`, `x-actor-roles`, `x-actor-permissions`, `x-correlation-id`
- Confirmed endpoint: `POST /ai/providers/:id/test`

Production auth contract:

- `POST /auth/login`
- `POST /auth/refresh`
- Bearer JWT access token
- Refresh-token rotation backed by `sessions.refreshTokenHash`
- 2FA-ready user flag: `users.twoFactorEnabled`

Integration 7G auth/session repair: `GET /auth/sessions` accepts the mock/dev `x-actor-id` header for authenticated-session inspection. Frontend production calls must continue to send `Authorization: Bearer <accessToken>`.

## Core Role Codes

customer, merchant, shipper, warehouse_staff, warehouse_manager, driver, fleet_manager, carrier, freight_forwarder, logistic_disponent, support_agent, finance_admin, compliance_admin, super_admin, ai_agent.

## Endpoint Groups

- `/auth`
- `/users`
- `/roles`
- `/merchants`
- `/customers`
- `/warehouse`
- `/inventory`
- `/orders`
- `/shipments`
- `/packages`
- `/disponent`
- `/dispatch`
- `/routes`
- `/tracking`
- `/driver`
- `/drivers`
- `/fleet`
- `/carriers`
- `/payments`
- `/escrow`
- `/ledger`
- `/returns`
- `/disputes`
- `/notifications`
- `/documents`
- `/ai`
- `/approvals`
- `/audit`
- `/analytics`
- `/admin`
- `/compliance`

## Disponent Console

- `GET /disponent/queue`
- `GET /disponent/live-map`
- `GET /disponent/exceptions`
- `POST /disponent/tour-plans`
- `POST /disponent/tour-plans/:id/approve`
- `POST /disponent/tours/:id/approve`
- `POST /disponent/tour-plans/:id/reject`
- `POST /disponent/assign-driver`
- `POST /dispatch/assign-driver`
- `POST /disponent/reassign-driver`
- `POST /disponent/assign-carrier`
- `POST /disponent/exceptions/:id/resolve`

The Logistic Disponent cannot edit ledgers, release disputed escrow, change roles, delete users, delete audit logs, or manage finance rules.

## Driver App

- `GET /driver/jobs`
- `POST /driver/jobs/:id/accept`
- `POST /driver/jobs/:id/reject`
- `POST /driver/pickup/:shipmentId/complete`
- `POST /drivers/pickup/:shipmentId/complete`
- `POST /driver/delivery/:shipmentId/attempt`
- `POST /driver/delivery/:shipmentId/complete`
- `POST /drivers/delivery/:shipmentId/complete`
- `POST /shipments/:id/deliver`
- `POST /driver/location`
- `GET /driver/earnings`

## Warehouse App

- `POST /warehouse/pick/start`
- `POST /warehouse/scan`
- `POST /warehouse/pack`
- `POST /warehouse/label`
- `POST /warehouse/stage`
- `POST /warehouse/ready-for-dispatch`

Package readiness requires scan, pack, label generation, and staging.

Warehouse package payloads accept any one of `packageId`, `id`, or `barcode`; `packageId` remains the preferred field.

Workflow DTOs also accept non-semantic frontend trace fields including `workflow`, `workflowId`, `operationId`, `frontendAction`, `requestId`, `correlationId`, `actorId`, `userId`, `role`, `notes`, and `note`; these fields are accepted to keep frontend integration telemetry from causing DTO mismatch failures.

## Shipment Creation

`POST /shipments` requires an existing `orderId`. Valid payload:

```json
{
  "orderId": "order_id",
  "packageBarcode": "PKG-100",
  "origin": { "city": "Duisburg" },
  "destination": { "city": "Dusseldorf" }
}
```

`barcode` is accepted as a frontend alias for `packageBarcode`. `referenceId` or `id` are accepted as frontend aliases for `orderId`. Unknown order references return the standard `400 ContractMismatch` error; they must not return `500`.

The seed script includes deterministic Integration 7G development records for `cust_7f`, `merchant_7f`, `ord_7f`, `ship_7f`, `driver_7f`, `ret_7f`, `apr_7f`, `apr_refund_7f`, `PKG-7F-WF`, `PKG-7F-RBAC-002`, and `dev-provider-001`. These records exist only to make the public safe dev/mock backend replayable with frontend fixture IDs.

## Tracking and Proof

- `GET /tracking/:shipmentId`
- `POST /tracking/events`
- `DELETE /tracking/:shipmentId/events/:id` always fails by immutability policy.
- `POST /documents/upload-reference`

Object reference purposes:

- delivery_photo
- pickup_photo
- signature
- warehouse_packing_proof
- dispute_evidence
- document

Delivery and pickup proof DTO aliases:

- `barcode` or `scanCode` may be sent instead of `packageScanCode`.
- `photoUrl` may be sent instead of `photoObjectKey`.
- `signatureUrl` may be sent instead of `signatureObjectKey`.
- Delivery GPS may be sent as `gps.latitude`/`gps.longitude`, `gps.lat`/`gps.lng`, `location.lat`/`location.lng`, or top-level `latitude`/`longitude`.

## Payments, Escrow, Ledger

- `POST /payments/refunds`
- `POST /escrow/release`
- `GET /ledger`
- `POST /ledger/entries`
- `PATCH /ledger/entries/:id` always fails by immutability policy.
- `DELETE /ledger/entries/:id` always fails by immutability policy.

Escrow release requires accepted proof, no active dispute, settlement window passed, and releasable payment status.

## AI Approval Payloads

Base AI action authorization:

```json
{
  "agentCode": "ai_finance_agent",
  "requestedAction": "refund recommendation only",
  "riskLevel": "L3_HIGH",
  "actorRoles": ["ai_agent"],
  "approvalCount": 1
}
```

AI workflow endpoints:

- `POST /ai/actions/authorize`
- `POST /ai/approvals/:id/approve`
- `POST /ai/providers/:id/test`
- `POST /ai/order/validate`
- `POST /ai/warehouse/readiness-check`
- `POST /ai/disponent/tour-recommendations`
- `POST /ai/route/eta`
- `POST /ai/route/reassignment`
- `POST /ai/exceptions/failed-pickup`
- `POST /ai/exceptions/failed-delivery`
- `POST /ai/finance/escrow-release-recommendation`
- `POST /ai/finance/refund-recommendation`
- `POST /ai/disputes/evidence-summary`

AI finance endpoints return recommendations only. They do not execute escrow release, refund, payout, ledger mutation, or dispute settlement.

## Status Enums

Frontend should import current status values from OpenAPI or use the documented enums:

- OrderStatus
- ShipmentStatus
- PaymentStatus
- DisputeStatus
- ReturnStatus
- PackageStatus
- AiRiskLevel
- ApprovalStatus

## OpenAPI

Generated contract:

```text
docs/openapi/openapi.json
```

Regenerate:

```bash
npm run openapi:export
```

## Integration 7C Contract Repair Notes

- Request schemas were tightened for auth, orders, dispatch assignment, returns, approvals, AI provider creation/test, and 2FA verification.
- Known invalid request bodies now return the standard error envelope with `400` or `403`; backend crashes are not expected for the documented workflow contracts.
- Prisma reference mismatches on order, return, dispatch assignment, and driver job mutation are converted to clean `400 ContractMismatch` responses instead of leaking database exceptions.
- CORS preflight is explicit for the frontend dev headers listed above.
- Endpoint intentionally unavailable: none in the 7C workflow scope. Live external provider calls, live payments, live logistics bookings, production queue workers, and production deployment remain unavailable by mock/dev policy.

## Integration 7D Contract Repair Notes

- `POST /shipments` now has a DTO-backed OpenAPI request schema and returns `400 ContractMismatch` for order/package reference failures instead of `500`.
- Delivery GPS accepts `latitude`/`longitude` and frontend aliases `lat`/`lng`; the backend normalizes aliases before proof policy checks.
- Warehouse package flow accepts `packageId`, `id`, or `barcode` and still rejects payloads where no package identifier is present.
- Development actor roles accept comma-separated or JSON-array header values and normalize documented aliases without disabling RBAC.

## Milestone 6 Frontend Support Docs

- `docs/FRONTEND_INTEGRATION_GUIDE.md`
- `docs/API_ERROR_CATALOG.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/MOCK_PROVIDER_BEHAVIOR.md`
- `docs/WORKFLOW_PAYLOAD_EXAMPLES.md`
- `docs/MILESTONE_6_RELEASE_CANDIDATE_REPORT.md`

## Milestone 4 Contract Additions

- Auth now uses credential verification: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password-reset/request`, `POST /auth/password-reset/complete`, `POST /auth/2fa/setup`.
- Database-backed workflow groups now include orders, shipments, packages, warehouse package flow, dispatch assignments, Disponent tour plans, driver jobs, tracking events, disputes, returns, notifications, AI recommendations, and approval requests.
- Mock provider adapters are available for safe frontend testing under `/provider-adapters/*`.
- OpenAPI export contains 126 operations in `docs/openapi/openapi.json`.
- Production deployment remains blocked; frontend integration should use development credentials, mock provider modes, and test actor headers only in non-production environments.

## Milestone 6 Contract Additions

- Added `GET /meta/version` and `GET /meta/contract` for frontend contract display and compatibility checks.
- Added standard error response envelope under `error.code`, `error.message`, `error.details`, `error.status`, `error.path`, `error.correlationId`, and `error.timestamp`.
- Added contract tests for OpenAPI parseability, endpoint groups, DTO/status enums, role-protected documentation, and stable frontend-critical response shapes.
- Added E2E smoke tests for the Codey-critical backend workflows against disposable PostgreSQL.
