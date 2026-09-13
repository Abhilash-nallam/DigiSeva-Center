
  # DigiSeva Government Services Website

  This is a code bundle for DigiSeva Government Services Website. The original project is available at https://www.figma.com/design/9unOAn8EUvALTW2OCOpYp7/DigiSeva-Government-Services-Website.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Production integration

  Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the trusted
  DigiSeva backend. Appwrite public identifiers may be configured there, but
  Appwrite API keys, payment credentials, NEXORA TOTP secrets, and encryption
  keys must remain inside Appwrite Functions or the private backend.

  The frontend uses these backend contracts when configured:

  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/verify-totp`
  - `POST /api/applications/:applicationId/tracking`

  The backend must enforce RBAC, customer ownership, secure sessions, TOTP
  verification, payment verification, document privacy, rate limiting, CSRF
  protection, and append-only audit logging. Development-only in-memory data is
  used only when no API base URL is configured.
  