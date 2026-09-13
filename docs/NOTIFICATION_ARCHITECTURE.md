# Notification Architecture

DigiSeva owns the notification adapter boundary. Provider credentials remain in Appwrite Functions or the private deployment environment.

## Adapter contract

```ts
send(template: NotificationTemplate, recipient: Recipient, context: SafeNotificationContext): Promise<NotificationResult>
```

Supported templates:

- `application_reference`
- `otp`
- `payment_initiated`
- `payment_success`
- `payment_failed`
- `payment_pending`
- `document_verified`
- `document_rejected`
- `reupload_requested`
- `application_status_changed`
- `customer_message`
- `receipt_ready`
- `support_updated`

Every send creates a `notification_logs` record with hashed recipient, template, provider result, status, and correlation ID. OTPs are short-lived, never logged, and not stored in plaintext. Messages contain only customer-safe application information; passwords, TOTP secrets, UPI PINs, and recovery codes are never sent through ordinary notifications.

Status values are `CONFIGURATION_REQUIRED`, `QUEUED`, `SENT`, `FAILED`, and `RETRYING`. The frontend must not claim delivery when the adapter is not connected.
