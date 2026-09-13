# DigiSeva Production Release Candidate

This package is a frontend production hardening release. It is designed to connect to the DigiSeva backend and the project's own authentication/OTP/email infrastructure.

## Included
- Responsive customer and admin layouts.
- Production-safe public messaging with misleading government-affiliation claims removed.
- No legacy mock application fallback in the customer API boundary.
- Development seed data isolated behind the Vite development flag.
- Customer tracking requires Application ID and registered mobile number in the client contract; the production backend must enforce this independently.
- QR/UPI and Pay Later payment flow retained.
- QR upload preview in Admin payment settings.
- Production build does not accept the frontend mock admin login or mock TOTP flow.
- Receipt actions use print/save until the backend receipt endpoint is connected.
- Application creation is available only through the development store until the production application API is connected; the production submit action is intentionally disabled rather than falsely reporting a successful submission.

## Required before public launch
1. Connect `/api/applications` and related application endpoints.
2. Connect server-side authorization and customer ownership checks.
3. Connect private document storage and malware/file validation.
4. Connect the project's own admin password + TOTP infrastructure.
5. Connect the project's own OTP/email infrastructure.
6. Replace development QR/config persistence with authenticated backend settings.
7. Add production database, backups, rate limiting, secure cookies, CSRF protections where applicable, audit persistence, monitoring and incident recovery.

The frontend intentionally does not claim that these backend controls are already active.
