# Frontend Integration Guide

Status: Milestone 6 release-candidate contract for Codey/frontend integration.

## API Contract Marker

- API version: `0.1.0-rc.1`
- Contract status: `release_candidate`
- Runtime marker: `GET /meta/version`
- Contract marker: `GET /meta/contract`
- OpenAPI file: `docs/openapi/openapi.json`

Breaking-change policy: documented request/response shapes must not change without a new API version marker, updated OpenAPI export, updated frontend notes, and migration guidance.

## Frontend Setup

Use development actor headers only in non-production integration:

```http
x-actor-id: dev_actor_id
x-actor-roles: super_admin
```

Production clients must use `Authorization: Bearer <accessToken>` from `POST /auth/login`.

## Major Workflow Groups

| Workflow | Primary endpoints | Owner module |
| --- | --- | --- |
| Auth/session | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/sessions` | Auth |
| Order intake | `POST /orders`, `GET /orders/:id` | Orders |
| Warehouse package flow | `/warehouse/pick/start`, `/warehouse/scan`, `/warehouse/pack`, `/warehouse/label`, `/warehouse/stage`, `/warehouse/ready-for-dispatch` | Warehouse |
| Disponent planning | `/disponent/queue`, `/disponent/tour-plans`, `/disponent/tour-plans/:id/approve`, `/disponent/assign-driver` | Disponent |
| Driver app | `/driver/jobs`, `/driver/pickup/:shipmentId/complete`, `/driver/delivery/:shipmentId/complete`, `/driver/location` | Drivers |
| Tracking | `GET /tracking/:shipmentId`, `POST /tracking/events` | Tracking |
| Finance | `/escrow/release`, `/payments/refunds`, `/ledger` | Escrow, Payments, Ledger |
| AI governance | `/ai/*`, `/approvals` | AI, Approvals |
| Mock providers | `/provider-adapters/*` | Provider Adapters |

## Frontend-Critical Stable Shapes

All successful workflow endpoints return JSON objects or arrays documented by OpenAPI. All failed requests use:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "request field failed validation",
    "details": {
      "messages": ["request field failed validation"]
    },
    "status": 400,
    "path": "/orders",
    "correlationId": "req_abc",
    "timestamp": "2026-06-19T00:00:00.000Z"
  }
}
```

## Frontend Integration Impact

- Frontend can now display the API version and contract status from `/meta/version`.
- Error rendering can key off `error.code` instead of parsing raw strings.
- Workflow examples live in `WORKFLOW_PAYLOAD_EXAMPLES.md`.
- Status enums and role permissions live in `ROLE_PERMISSION_MATRIX.md`.
- Mock provider behavior is explicit in `MOCK_PROVIDER_BEHAVIOR.md`.
