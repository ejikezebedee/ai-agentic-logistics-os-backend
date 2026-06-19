# Provider Adapters

Milestone 4 adds explicit adapter boundaries while keeping every external provider in mock/dev mode.

## Adapter Interfaces

- S3-compatible storage: upload-reference generation only.
- Payment provider: authorization simulation only, no live money movement.
- Maps/GPS provider: ETA simulation only, no live routing provider call.
- SMS/email/WhatsApp provider: queued message simulation only.
- KYC provider: development verification response only.
- Carrier API provider: shipment booking simulation only.
- ERP/accounting provider: journal-post simulation only.
- Webhook signatures: HMAC-SHA256 verification design hook, provider-specific live secrets disabled in this build.

## Mock Endpoints

- `GET /provider-adapters/health`
- `POST /provider-adapters/storage/upload-reference`
- `POST /provider-adapters/payments/authorize`
- `POST /provider-adapters/maps/eta`
- `POST /provider-adapters/messaging/send`
- `POST /provider-adapters/kyc/verify`
- `POST /provider-adapters/carrier/shipments`
- `POST /provider-adapters/erp/ledger-events`
- `POST /provider-adapters/webhooks/verify-signature`

All mock responses include a live-operation flag set to `false`.

## Failure and Retry Behavior

- Provider commands must be idempotent with caller-supplied reference IDs.
- Transient provider failures should enqueue retry jobs, not block request threads indefinitely.
- Permanent failures must create audit/security events and return a frontend-readable error code.
- Live provider retries belong in BullMQ workers started only through the production runbook. This build exposes enqueue-only queue contracts and starts no workers.

## Production Contract Requirements

- Store provider credentials only in the deployment secret manager.
- Verify inbound webhook signatures before persistence or settlement impact.
- Persist raw webhook event metadata with signature validity and processing status.
- Keep payment, carrier, KYC, maps, messaging, ERP, and storage adapters replaceable behind the existing service boundary.
