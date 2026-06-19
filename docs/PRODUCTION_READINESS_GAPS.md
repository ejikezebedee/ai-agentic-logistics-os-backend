# Production Readiness Gaps

Production deployment is still blocked.

## Remaining Gaps

- Real PostgreSQL migration run must pass in the target CI/staging environment before deployment approval.
- Redis/BullMQ queues are contract-ready only; live workers are not started and must be deployed by explicit runbook action.
- Real provider credentials are intentionally absent.
- 2FA endpoints are mock/dev-ready but need real TOTP/recovery-code verification.
- Password reset needs email delivery adapter connection.
- Rate limiting is implemented in-process for readiness; production should move counters to Redis and add device fingerprinting.
- Payment, carrier, KYC, maps, messaging, and ERP adapters are mock-only.
- Observability exposes health, readiness, and metrics-ready JSON; production needs OpenTelemetry/Prometheus and alert routing.
- Data-retention policy exists but needs legal approval per operating jurisdiction.
- Webhook signature verification hook exists; live provider secrets and replay protection must be configured before real webhooks.
- Brute-force controls need production Redis-backed counters, device intelligence, alert thresholds, and account lockout review.

Frontend integration can continue safely against mock/dev providers and the frozen OpenAPI contract.
