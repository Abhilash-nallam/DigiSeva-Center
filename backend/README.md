# DigiSeva backend

This package contains the server-side Appwrite Function foundation. It is intentionally separate from the React frontend and never uses browser storage or privileged Vite variables.

## Commands

```powershell
npm install
npm run typecheck
npm test
npm run build
```

Deploy each function entrypoint under `src/functions/` to Appwrite Functions. Copy `.env.example` into the Function environment and provide real server-only values. Missing external integrations fail closed with `CONFIGURATION_REQUIRED`; no provider success is simulated.

The database layer uses the collection names and fields in `docs/APPWRITE_SCHEMA.md`. Provisioning and indexes must be applied to a staging Appwrite project before production promotion.
