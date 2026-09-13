# Appwrite Production Schema

Use one Appwrite database with explicit collection IDs supplied through deployment configuration. All collections require server-side access through Appwrite Functions; the public client receives no privileged API key.

## Collections

| Collection | Required fields | Indexes |
|---|---|---|
| `customers` | `name`, `mobileHash`, `emailHash`, `createdAt`, `lastActivityAt` | unique `mobileHash`, `emailHash` |
| `applications` | `applicationId`, `serviceId`, `serviceVersion`, `customerRef`, `status`, `paymentStatus`, `jurisdiction`, `createdAt`, `updatedAt`, `completedAt` | unique `applicationId`, `customerRef`, `status`, `createdAt` |
| `application_events` | `applicationRef`, `type`, `actorRef`, `payload`, `createdAt` | `applicationRef`, `createdAt` |
| `application_documents` | `applicationRef`, `customerRef`, `type`, `storageId`, `originalFilename`, `mimeType`, `size`, `checksum`, `status`, `uploadedAt`, `verifiedAt`, `verifiedBy` | `applicationRef`, `customerRef`, `status` |
| `payments` | `paymentId`, `applicationRef`, `amountPaise`, `governmentFeePaise`, `digiSevaFeePaise`, `otherChargesPaise`, `totalPaise`, `status`, `providerReference`, `initiatedAt`, `paidAt`, `verifiedAt`, `idempotencyKey` | unique `paymentId`, unique `idempotencyKey`, `applicationRef`, `status` |
| `payment_events` | `paymentRef`, `providerEventId`, `eventType`, `signatureVerified`, `payloadHash`, `createdAt` | unique `providerEventId`, `paymentRef` |
| `receipts` | `receiptId`, `applicationRef`, `paymentRef`, `storageId`, `createdAt` | unique `receiptId`, `applicationRef` |
| `messages` | `applicationRef`, `customerRef`, `senderType`, `body`, `createdAt`, `readAt` | `applicationRef`, `customerRef`, `createdAt` |
| `support_tickets` | `ticketId`, `applicationRef`, `customerRef`, `category`, `priority`, `status`, `assignedAdmin`, `createdAt`, `updatedAt`, `resolvedAt` | unique `ticketId`, `status`, `assignedAdmin` |
| `sla_records` | `applicationRef`, `targetAt`, `warningAt`, `overdueAt`, `state`, `updatedAt` | `state`, `overdueAt` |
| `services` | `serviceId`, `name`, `category`, `authority`, `jurisdiction`, `eligibility`, `documents`, `governmentFeePaise`, `digiSevaFeePaise`, `otherChargesPaise`, `estimatedTime`, `steps`, `officialPortal`, `active`, `version`, `lastVerified` | unique `serviceId`, `active`, `category` |
| `service_versions` | `serviceRef`, `version`, `snapshot`, `createdBy`, `createdAt` | unique compound `serviceRef+version` |
| `service_fees` | `serviceRef`, `jurisdiction`, `governmentFeePaise`, `digiSevaFeePaise`, `otherChargesPaise`, `effectiveFrom`, `effectiveTo` | `serviceRef`, `jurisdiction` |
| `official_sources` | `serviceRef`, `authority`, `state`, `department`, `url`, `sourceType`, `verifiedAt`, `verifiedBy`, `status` | `serviceRef`, `status`, `verifiedAt` |
| `admins` | `email`, `passwordHash`, `role`, `enabled`, `nexoraState`, `createdAt`, `lastLoginAt` | unique `email`, `enabled` |
| `admin_roles` | `name`, `description`, `enabled` | unique `name` |
| `admin_permissions` | `roleRef`, `permission`, `enabled`, `updatedBy`, `updatedAt` | unique compound `roleRef+permission` |
| `audit_logs` | `actorRef`, `actorRole`, `action`, `resourceType`, `resourceId`, `timestamp`, `result`, `metadata`, `requestId` | `timestamp`, `actorRef`, `resourceType+resourceId`, `requestId` |
| `notification_logs` | `channel`, `template`, `recipientHash`, `applicationRef`, `status`, `providerId`, `createdAt` | `applicationRef`, `status`, `createdAt` |
| `system_health` | `component`, `status`, `checkedAt`, `latencyMs`, `details` | unique `component`, `checkedAt` |

## Money

Only integer paise fields are authoritative. The browser may display formatted INR but cannot submit an authoritative amount. Server Functions calculate totals from the active service version and fee records.

## Storage

Create a private Appwrite Storage bucket for documents. Disable public reads. Files are addressed by storage ID and served only through an authorized Function that verifies admin role or application ownership before issuing a short-lived access response.
