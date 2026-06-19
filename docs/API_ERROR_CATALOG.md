# API Error Catalog

All API errors use the release-candidate envelope:

```json
{
  "error": {
    "code": "RBAC_PERMISSION_DENIED",
    "message": "Forbidden resource",
    "details": {
      "messages": ["Forbidden resource"]
    },
    "status": 403,
    "path": "/ledger",
    "correlationId": "req_dev_123",
    "timestamp": "2026-06-19T00:00:00.000Z"
  }
}
```

## Catalog

| Code | HTTP status | Frontend handling |
| --- | ---: | --- |
| `VALIDATION_FAILED` | 400 | Show field or form validation messages from `details.validation` or `details.messages`. |
| `BAD_REQUEST` | 400 | Show workflow/policy rejection message, for example disputed escrow release blocked. |
| `AUTH_UNAUTHORIZED` | 401 | Clear invalid auth state and ask user to sign in again. |
| `RBAC_PERMISSION_DENIED` | 403 | Show permission-denied state; do not retry automatically. |
| `RATE_LIMIT_EXCEEDED` | 429 | Show retry state using `details.retryAfterSeconds` when present. |
| `AI_APPROVAL_REQUIRED` | 403 | Route user to approval request or pending approval UI. |
| `PROVIDER_FAILURE` | 502 | Show provider unavailable/degraded state; retry only through an explicit user action. |
| `HTTP_409` | 409 | Treat as immutable or conflict state. Used for ledger/audit/tracking mutation blocks. |
| `HTTP_500` | 500 | Show generic failure and include correlation ID in support report. |

## Auth Errors

Invalid credentials, invalid refresh tokens, expired reset tokens, and invalid 2FA codes return `AUTH_UNAUTHORIZED`.

## RBAC Errors

Missing roles return `RBAC_PERMISSION_DENIED`. Frontend must not hide server authorization failures behind optimistic local role checks.

## Rate-Limit Errors

Sensitive endpoints have rate-limit protection: login, refresh, password reset, AI, tracking lookup, document upload references, provider tests, and driver location check-ins.

## AI Approval Errors

High-risk and critical AI actions require approval and must not be executed directly by frontend clients. AI finance endpoints return recommendations only.
