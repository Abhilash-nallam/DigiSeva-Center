# DigiSeva and NEXORA Authenticator Integration

NEXORA is a separate authenticator application. DigiSeva never stores or receives a raw TOTP secret in the browser.

## Enrollment protocol

1. Authenticated Super Admin requests `POST /api/admin/nexora/enrollments`.
2. DigiSeva Function creates a one-time `enrollmentId`, nonce, and opaque short-lived token. The token is bound to the target admin and expires in 10 minutes.
3. DigiSeva returns a QR payload containing only the version, DigiSeva tenant identifier, enrollment ID, nonce, NEXORA callback URL, and opaque enrollment token. It must not contain passwords, API keys, or a raw TOTP secret.
4. NEXORA scans the QR, validates the payload version and expiry, registers the device securely, and calls the server callback.
5. DigiSeva marks the enrollment `SCANNED`, then `CONFIRMED` only after authenticated NEXORA-to-server confirmation.
6. Admin submits the first six-digit code to `POST /api/admin/nexora/enrollments/:id/verify`.
7. The Function verifies the code against server-held secret material, enforces rate limits and replay protection, and changes state to `TOTP_VERIFIED` then `ACTIVE`.
8. Recovery codes are generated and hashed server-side. Plain codes are returned once over the authenticated setup response and never logged or persisted in the frontend.

## QR payload

```json
{
  "protocol": "nexora-digiseva",
  "version": 1,
  "tenant": "<public-tenant-id>",
  "enrollmentId": "<opaque-id>",
  "nonce": "<single-use-nonce>",
  "token": "<short-lived-opaque-token>",
  "expiresAt": "<ISO-8601>",
  "callback": "<NEXORA-approved-callback-identifier>"
}
```

The token is single-use, server-bound, and invalidated on cancellation, expiry, successful activation, or replay.

## States

`PENDING -> SCANNED -> CONFIRMED -> TOTP_VERIFIED -> ACTIVE`

Abandoned or expired enrollments become `EXPIRED`. Super Admin cancellation becomes `CANCELLED`. Revocation creates a security event and invalidates active sessions as configured.

## Login contract

- `POST /api/admin/auth/login`: email and password; returns an expiring server-side challenge cookie only.
- `POST /api/admin/auth/verify-totp`: challenge cookie plus current TOTP; returns secure session cookie.
- TOTP attempts are rate-limited, time-window constrained, replay-protected, and audited.
- Session cookies are `HttpOnly`, `Secure`, and `SameSite=Lax` or stricter.

## Recovery and rotation

Recovery codes are one-time use, stored only as strong hashes, and every use is audited. Re-enrollment and secret rotation require Super Admin authorization and re-authentication. Raw TOTP secrets are never returned after enrollment.

## Required server controls

NEXORA endpoints must authenticate service-to-service requests, validate protocol version, verify nonce and token state, reject duplicate callbacks, use request IDs, sanitize errors, and avoid logging tokens or codes. DigiSeva remains `CONFIGURATION_REQUIRED` until the NEXORA service endpoint and secret-management implementation are connected.
