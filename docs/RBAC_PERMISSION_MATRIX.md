# DigiSeva RBAC Permission Matrix

RBAC must be enforced inside every Appwrite Function. UI visibility is not authorization.

| Permission | SUPER_ADMIN | OPERATIONS_ADMIN default |
|---|---:|---:|
| `applications.read` | yes | yes |
| `applications.edit` | yes | configurable |
| `applications.status` | yes | configurable |
| `customers.read` | yes | yes |
| `customers.reveal` | yes | configurable and audited |
| `documents.read` | yes | configurable |
| `documents.verify` | yes | configurable |
| `documents.reject` | yes | configurable |
| `payments.read` | yes | yes |
| `payments.verify` | yes | configurable |
| `payments.reject` | yes | configurable |
| `support.manage` | yes | configurable |
| `sla.manage` | yes | configurable |
| `services.manage` | yes | configurable |
| `fees.manage` | yes | no by default |
| `sources.manage` | yes | no by default |
| `admins.manage` | yes | no |
| `roles.manage` | yes | no |
| `nexora.manage` | yes | no |
| `security.manage` | yes | no |
| `settings.manage` | yes | no |
| `audit.read` | yes | configurable |
| `audit.delete` | no normal UI | no |
| `health.read` | yes | configurable |

Each request must verify the authenticated session, enabled account, role, permission, resource scope, and an audit event for sensitive actions. Operations permissions are stored in `admin_permissions`; Super Admin changes require re-authentication and cannot grant permission to disable or alter a Super Admin account through an Operations session.
