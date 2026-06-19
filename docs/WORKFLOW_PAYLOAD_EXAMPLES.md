# Workflow Payload Examples

Use these payloads with development actor headers or a Bearer token from `POST /auth/login`.

## Auth

```json
{ "email": "superadmin@example.local", "password": "ChangeMe-Local-Only-123!" }
```

Refresh:

```json
{ "refreshToken": "returned-refresh-token" }
```

## Customer Order

```json
{
  "merchantId": "merchant_id",
  "customerId": "customer_id",
  "items": [{ "skuId": "sku_id", "quantity": 1, "unitPrice": 149 }]
}
```

## Warehouse Flow

```json
{ "packageId": "package_id", "barcode": "PKG-100" }
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

Approve with `POST /disponent/tour-plans/:id/approve`.

Assign driver:

```json
{
  "shipmentId": "shipment_id",
  "driverId": "driver_id",
  "packageStatus": "ready_for_dispatch"
}
```

## Driver Proof

Pickup:

```json
{ "packageScanCode": "PKG-100", "photoObjectKey": "proof/pickup.jpg" }
```

Delivery:

```json
{
  "tier": "low_value",
  "gps": { "latitude": 51.4344, "longitude": 6.7623, "withinTolerance": true },
  "otp": "123456",
  "photoObjectKey": "proof/delivery.jpg"
}
```

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
