# Payment and Webhook Contract

Payment provider credentials and verification run only inside an Appwrite Function. The browser is never authoritative for success.

## Lifecycle

`UNINITIATED -> INITIATED -> PENDING -> SUCCESS|FAILED|EXPIRED|UNKNOWN`

Terminal states may later transition to `REFUNDED` or `DISPUTED` through an authorized reconciliation operation.

## Endpoints

- `POST /api/payments` creates a server-calculated payment using `applicationId` and an idempotency key.
- `GET /api/payments/:paymentId` returns customer-safe status after ownership verification.
- `POST /api/payments/webhooks/:provider` accepts provider callbacks only after signature verification.
- `POST /api/payments/:paymentId/reconcile` is Super Admin or configured payment permission only.

## Webhook requirements

1. Read the raw request body before parsing.
2. Verify provider signature, timestamp tolerance, and merchant identity.
3. Reject duplicate `providerEventId` using a unique database index.
4. Look up the payment server-side and compare application, currency, and amount in paise.
5. Apply only valid state transitions.
6. Persist the payment event and append an audit record with request ID.
7. Update the application and create a receipt only for verified success.
8. Return a provider-safe response without stack traces or secrets.

A mismatched amount, merchant, application, signature, or currency is rejected and flagged for reconciliation. An uncertain provider response remains `UNKNOWN` or `PENDING`; it is never silently converted to success or failure.

## Customer UI states

The UI may show `Payment request sent`, `Waiting for confirmation`, `Payment status is being confirmed`, `Payment failed`, or `Payment successful` only from the backend payment response. Screenshots, UPI IDs, redirects, and client callbacks are evidence for support only, never proof of payment.
