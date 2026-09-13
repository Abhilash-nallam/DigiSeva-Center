# DigiSeva Deployment

## Architecture

`GitHub -> Appwrite Sites -> React/Vite frontend -> Appwrite Database, Storage, Functions, Auth`

Cloudflare may provide DNS, TLS, WAF, and edge controls. Keep the frontend dependent on the API abstraction, not directly on privileged Appwrite APIs, so migration to dedicated infrastructure remains possible.

## Frontend

1. Install the locked dependencies with `npm ci`.
2. Copy `.env.example` to the deployment environment.
3. Set `VITE_API_BASE_URL` to the HTTPS DigiSeva API/Function gateway.
4. Set only public Appwrite identifiers in `VITE_*` variables.
5. Run `npm run build`.
6. Deploy `dist/` to Appwrite Sites.

Never put Appwrite API keys, payment credentials, NEXORA secrets, password pepper, webhook signing keys, or encryption keys in Vite environment variables.

## Backend configuration required

Create the collections and indexes in `APPWRITE_SCHEMA.md`, a private documents bucket, Functions for auth/NEXORA, applications, uploads, payments, webhooks, notifications, audit, and health. Configure allowed origins, secure cookies, rate limits, CSRF protection, request IDs, secret storage, backups, and monitoring before enabling production mode.

## Service states

The admin system should display `CONNECTED`, `CONFIGURATION_REQUIRED`, `DEGRADED`, or `DISABLED` based on real health checks. Do not use seed data or green placeholders in production.

## Rollout

Use a staging Appwrite project first. Run migration validation, ownership/RBAC tests, payment webhook replay tests, upload abuse tests, and responsive smoke tests. Promote only after the production checklist is signed off.
