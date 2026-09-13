# Production Security Checklist

## RED blockers

- [ ] Server-side admin email/password verification and password hashing.
- [ ] Server-side NEXORA TOTP, enrollment expiry, replay protection, rate limiting, and recovery-code hashes.
- [ ] HttpOnly, Secure, SameSite sessions with revocation and CSRF protection.
- [ ] Appwrite Function RBAC for every sensitive operation.
- [ ] Application ownership verification using registered mobile and future OTP support.
- [ ] Private document bucket, authorized access, signed temporary URLs, MIME/extension/size validation, and malware-scan integration.
- [ ] Server-calculated integer-paise amounts and authenticated payment webhook verification.
- [ ] Payment idempotency, duplicate-event protection, reconciliation, and amount matching.
- [ ] Append-only persistent audit logs.

## ORANGE workflow blockers

- [ ] Persist applications, payments, documents, messages, support tickets, SLA records, services, and configuration.
- [ ] Implement customer document upload to Appwrite Storage.
- [ ] Implement support and action-required queues.
- [ ] Implement server-timestamp SLA calculations.
- [ ] Complete insurance/loan application routing with a dedicated product model.
- [ ] Add server pagination, sorting, and filtering for admin queues.
- [ ] Add route-based navigation and error/loading/retry states for backend operations.

## Validation

- [ ] `npm run build`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] IDOR and broken-access-control tests.
- [ ] Upload abuse and path-traversal tests.
- [ ] Payment replay, duplicate, mismatch, and unsigned-webhook tests.
- [ ] Super Admin and Operations Admin permission matrix tests.
- [ ] Responsive checks at 320, 375, 430, 768, 1024, 1280, 1440, and 1920px.

Current repository classification: **Not production-ready until unchecked RED items are connected and server-enforced.**
