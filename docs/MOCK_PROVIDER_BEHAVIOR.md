# Mock Provider Behavior

Milestone 6 keeps provider integrations in mock/development mode only. No live secrets, live calls, payment movement, shipping booking, SMS/email delivery, or ERP posting is enabled.

| Provider area | Endpoint | Mock behavior |
| --- | --- | --- |
| S3-compatible storage | `POST /provider-adapters/storage/upload-reference` | Returns `mock://storage/<objectKey>` and `liveConnection: false`. |
| Payment provider | `POST /provider-adapters/payments/authorize` | Returns authorized mock reference with `liveMovement: false`. |
| Maps/GPS | `POST /provider-adapters/maps/eta` | Returns fixed ETA/distance with `liveConnection: false`. |
| SMS/email/WhatsApp | `POST /provider-adapters/messaging/send` | Returns queued status with `liveDelivery: false`. |
| KYC | `POST /provider-adapters/kyc/verify` | Returns `verified_for_development` with `liveCheck: false`. |
| Carrier API | `POST /provider-adapters/carrier/shipments` | Returns mock tracking reference with `liveBooking: false`. |
| ERP/accounting | `POST /provider-adapters/erp/ledger-events` | Returns mock journal reference with `livePosting: false`. |
| Webhooks | `POST /provider-adapters/webhooks/verify-signature` | Verifies HMAC shape when a development signing secret is provided. |

Production blockers remain: secret-manager injection, provider credential onboarding, signed webhook replay protection, retry/backoff policies, idempotency storage, reconciliation jobs, and external provider certification.
