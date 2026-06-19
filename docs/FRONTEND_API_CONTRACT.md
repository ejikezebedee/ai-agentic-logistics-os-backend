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
- `x-actor-roles`

Production auth contract:

- `POST /auth/login`
- `POST /auth/refresh`
- Bearer JWT access token
- Refresh-token rotation backed by `sessions.refreshTokenHash`
- 2FA-ready user flag: `users.twoFactorEnabled`

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
- OpenAPI export contains 92 paths in `docs/openapi/openapi.json`.
- Production deployment remains blocked; frontend integration should use development credentials, mock provider modes, and test actor headers only in non-production environments.

## Milestone 6 Contract Additions

- Added `GET /meta/version` and `GET /meta/contract` for frontend contract display and compatibility checks.
- Added standard error response envelope under `error.code`, `error.message`, `error.details`, `error.status`, `error.path`, `error.correlationId`, and `error.timestamp`.
- Added contract tests for OpenAPI parseability, endpoint groups, DTO/status enums, role-protected documentation, and stable frontend-critical response shapes.
- Added E2E smoke tests for the Codey-critical backend workflows against disposable PostgreSQL.
