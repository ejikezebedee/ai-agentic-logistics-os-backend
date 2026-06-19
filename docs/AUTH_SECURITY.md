# Auth Security

Milestone 4 replaces development token placeholders with credential-based authentication.

## Implemented

- Password verification uses bcrypt hashes stored on `users.passwordHash`.
- Login issues a short-lived JWT access token and opaque refresh token.
- Refresh tokens are SHA-256 hashed before persistence in `sessions.refreshTokenHash`.
- Refresh rotation revokes the previous session and creates a new session.
- Logout revokes the active refresh session.
- Authenticated users can list sessions through `GET /auth/sessions`.
- Authenticated users can invalidate a session through `DELETE /auth/sessions/:id`.
- Password reset is database-ready through `password_reset_tokens`.
- Password reset completion enforces expiry, one-time use, and active-session invalidation.
- 2FA is mock/dev-verification ready through `two_factor_challenges`, `/auth/2fa/setup`, and `/auth/2fa/verify`.
- In-process rate limiting is active for login, refresh, and password-reset endpoints.
- Existing test actor headers remain available for isolated contract tests only.

## Brute-Force Protection Notes

- Current readiness build blocks excessive attempts with in-memory counters.
- Production should move counters to Redis so limits work across horizontally scaled API instances.
- Failed login and reset abuse should create `security_events` with IP hash, device hash, user agent hash, and correlation ID.
- Account lockout policy needs legal/support approval before internet exposure to avoid denial-of-service against legitimate users.

## Required Before Production

- Set non-development `JWT_SECRET`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
- Replace in-process rate limiting with Redis-backed distributed counters.
- Add real TOTP/recovery-code verification behind the 2FA-ready endpoints.
- Add IP/device fingerprints to `security_events`.
- Run migrations against the production database with controlled release approval.
