# Workflow Payload Examples

Use these payloads with development actor headers or a Bearer token from `POST /auth/login`.

Integration 7G replay payloads may use deterministic safe dev/mock IDs seeded by `prisma/seed.ts`: `cust_7f`, `merchant_7f`, `ord_7f`, `ship_7f`, `driver_7f`, `ret_7f`, `apr_7f`, `apr_refund_7f`, `PKG-7F-WF`, `PKG-7F-RBAC-002`, and `dev-provider-001`.

## Auth

```json
{ "email": "superadmin@example.local", "password": "ChangeMe-Local-Only-123!" }
```

Refresh:

```json
{ "refreshToken": "returned-refresh-token" }
```

Mock/dev session inspection may use only an actor id:

```http
GET /auth/sessions
x-actor-id: cust_7f
```

Production callers must use `Authorization: Bearer <accessToken>`.

## Customer Order

```json
{
  "merchantId": "merchant_id",
  "customerId": "customer_id",
  "items": [{ "skuId": "sku_id", "quantity": 1, "unitPrice": 149 }]
}
```

Confirm with `POST /orders/:id/confirm`.

## Shipment Creation

```json
{
  "orderId": "order_id",
  "packageBarcode": "PKG-100",
  "origin": { "city": "Duisburg" },
  "destination": { "city": "Dusseldorf" }
}
```

`barcode` is also accepted as a frontend alias for `packageBarcode`. `referenceId` and `id` are accepted as frontend aliases for `orderId`. Unknown order references return `400 ContractMismatch`.

## Warehouse Flow

```json
{ "packageId": "package_id", "barcode": "PKG-100" }
```

Frontend aliases are also accepted:

```json
{ "id": "package_id" }
```

Call order:

1. `POST /warehouse/pick/start`
2. `POST /warehouse/scan`
3. `POST /warehouse/pack`
4. `POST /warehouse/label`
5. `POST /warehouse/stage`
6. `POST /warehouse/ready-for-dispatch`

## Disponent Tour Approval

```json
{
  "disponentId": "disponent_user_id",
  "routeSummary": { "stops": ["warehouse", "customer"], "vehicleType": "van" },
  "aiRecommendationId": "optional_ai_recommendation_id"
}
```

Approve with `POST /disponent/tour-plans/:id/approve` or the frontend-compatible alias `POST /disponent/tours/:id/approve`.

Assign driver:

```json
{
  "shipmentId": "shipment_id",
  "driverId": "driver_id",
  "packageStatus": "ready_for_dispatch"
}
```

Frontend aliases are also accepted:

```json
{ "packageId": "shipment_id", "assignedDriverId": "driver_id" }
```

Integration 7G replay example:

```json
{
  "packageId": "ship_7f",
  "assignedDriverId": "driver_7f",
  "frontendAction": "assign-driver"
}
```

Use `POST /dispatch/assign-driver` for the industrial MVP dispatch path. `POST /disponent/assign-driver` remains available for existing Disponent console flows.
`packageStatus` may be omitted by the frontend; the backend defaults it to `ready_for_dispatch` and still rejects non-ready status values.

## Driver Proof

Pickup:

```json
{ "packageScanCode": "PKG-100", "photoObjectKey": "proof/pickup.jpg" }
```

Frontend aliases are also accepted:

```json
{ "barcode": "PKG-100", "photoUrl": "mock://pickup.jpg" }
```

Use `POST /drivers/pickup/:shipmentId/complete`. The legacy singular path `POST /driver/pickup/:shipmentId/complete` remains available.

Delivery:

```json
{
  "tier": "low_value",
  "gps": { "latitude": 51.4344, "longitude": 6.7623, "withinTolerance": true },
  "otp": "123456",
  "photoObjectKey": "proof/delivery.jpg"
}
```

GPS aliases are accepted when browser/device APIs emit shorter keys:

```json
{
  "tier": "low_value",
  "gps": { "lat": 51.4344, "lng": 6.7623, "withinTolerance": true },
  "otp": "123456"
}
```

Device-location payloads may also use `location` or top-level coordinates:

```json
{
  "location": { "lat": 51.4344, "lng": 6.7623, "withinTolerance": true },
  "barcode": "PKG-100",
  "photoUrl": "mock://delivery.jpg",
  "signatureUrl": "mock://signature.png"
}
```

Use `POST /shipments/:id/deliver` or `POST /drivers/delivery/:shipmentId/complete`. The legacy singular path `POST /driver/delivery/:shipmentId/complete` remains available.

## Tracking

```json
{
  "shipmentId": "shipment_id",
  "eventCode": "shipment.in_transit",
  "actorType": "driver",
  "actorId": "driver_id",
  "metadata": { "source": "frontend_smoke" }
}
```

## Escrow Blocked By Dispute

```json
{
  "accountId": "escrow_account_id",
  "shipmentId": "shipment_id",
  "amount": 149,
  "currency": "EUR",
  "proofAccepted": true,
  "disputeStatus": "opened",
  "settlementWindowPassed": true,
  "paymentStatus": "held_in_escrow",
  "actorRoles": ["finance_admin"]
}
```

Expected result: `400` because disputed escrow cannot be released.

## Refund Ledger Correction

```json
{
  "paymentId": "payment_id",
  "accountId": "escrow_account_id",
  "amount": 20,
  "currency": "EUR",
  "reason": "return approved"
}
```

Approve refund request with `POST /approvals/refunds/:id/approve`:

```json
{ "comment": "Approved for mock/dev integration." }
```

## Return Request

```json
{
  "orderId": "order_id",
  "shipmentId": "optional_shipment_id",
  "customerId": "customer_id",
  "reason": "damaged item"
}
```

When a development customer actor creates a return, `customerId` may be omitted and the backend uses `x-actor-id`.

Update return status with `POST /returns/:id/status`:

```json
{
  "status": "return_approved",
  "inspection": { "condition": "accepted" },
  "refundId": "optional_refund_id",
  "comment": "approved by support"
}
```

Integration 7G status alias example:

```json
{
  "status": "return_received",
  "inspection": { "condition": "ok" },
  "operationId": "ReturnsController_updateStatus"
}
```

## AI Approval Examples

High-risk recommendation:

```json
{
  "paymentId": "payment_id",
  "approvalCount": 0,
  "reason": "customer dispute requires finance review"
}
```

Prohibited action:

```json
{
  "agentCode": "ai_compliance_agent",
  "requestedAction": "delete audit logs",
  "riskLevel": "L5_PROHIBITED",
  "actorRoles": ["ai_agent"],
  "approvalCount": 99
}
```

Approve AI action with `POST /ai/approvals/:id/approve`:

```json
{ "comment": "Approved for mock/dev integration; no live action executed." }
```

Test AI provider with `POST /ai/providers/:id/test`:

```json
{ "model": "mock-model", "prompt": "ping", "operationId": "AiController_testProvider" }
```

Non-semantic frontend trace fields such as `workflow`, `workflowId`, `operationId`, `frontendAction`, `requestId`, `correlationId`, `actorId`, `userId`, `role`, `notes`, and `note` are accepted on workflow DTOs and ignored by backend policy decisions.

```json
{ "model": "mock-model", "prompt": "ping" }
```

Expected result: `liveConnection` is `false`; no external AI provider call is made.
