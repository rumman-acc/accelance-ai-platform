# Services

## packages/server — Flowise Engine + Enterprise Auth

| Property         | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Type             | Express.js monolith                                                |
| Port             | **3002**                                                           |
| Start command    | `cd packages/server && node bin/run start`                         |
| Alt start (root) | `pnpm start:windows` (Windows) or `pnpm start:default` (Linux/Mac) |
| Build command    | `pnpm build` (from root, builds all packages)                      |
| Status           | ✅ Active                                                          |
| Platform mode    | ENTERPRISE (via `FLOWISE_PLATFORM=enterprise` in `.env`)           |
| Database         | PostgreSQL on Neon                                                 |

### What it does

-   Serves the Flowise React UI at `http://localhost:3002/`
-   Enterprise auth: login, registration, org/workspace/user management
-   All AI agent APIs: chatflows, agents, tools, document stores, etc.
-   Loads 200+ AI integrations from `packages/components` at startup
-   Runs TypeORM migrations automatically on startup
-   Encrypts credentials at rest (SECRETKEY_PATH)

### Enterprise Auth Routes (active when FLOWISE_PLATFORM=enterprise)

| Route                             | Method              | Purpose                     |
| --------------------------------- | ------------------- | --------------------------- |
| `/api/v1/account/register`        | POST                | Register org + admin user   |
| `/api/v1/account/login`           | POST                | Login (email/password)      |
| `/api/v1/account/logout`          | POST                | Logout                      |
| `/api/v1/account/invite`          | POST                | Invite user to workspace    |
| `/api/v1/account/forgot-password` | POST                | Password reset (needs SMTP) |
| `/api/v1/workspace`               | GET/POST/PUT/DELETE | Workspace management        |
| `/api/v1/workspaceuser`           | GET/POST/PUT/DELETE | User roles in workspace     |
| `/api/v1/organization`            | GET/PUT             | Organization settings       |
| `/api/v1/role`                    | GET/POST/PUT/DELETE | Custom role management      |
| `/api/v1/user`                    | GET/PUT             | User profile                |

### Key env vars (`packages/server/.env`)

| Variable                       | Value                   | Purpose                              |
| ------------------------------ | ----------------------- | ------------------------------------ |
| `FLOWISE_PLATFORM`             | `enterprise`            | Triggers enterprise mode (our patch) |
| `PORT`                         | `3002`                  | HTTP port                            |
| `DATABASE_TYPE`                | `postgres`              | DB driver                            |
| `DATABASE_HOST`                | Neon host               | PostgreSQL host                      |
| `DATABASE_PASSWORD`            | Neon password           | DB password                          |
| `DATABASE_SSL`                 | `true`                  | TLS for Neon                         |
| `SECRETKEY_PATH`               | `.flowise/` path        | Encryption key storage               |
| `JWT_AUTH_TOKEN_SECRET`        | 64-char hex             | JWT signing secret                   |
| `EXPRESS_SESSION_SECRET`       | string                  | Session cookie secret                |
| `SMTP_HOST/PORT/USER/PASSWORD` | Brevo                   | Email for user invites               |
| `SENDER_EMAIL`                 | `noreply@accelance.io`  | From address                         |
| `APP_URL`                      | `http://localhost:3002` | Base URL in email links              |

### First-time setup

1. Start: `cd packages/server && node bin/run start`
2. Migrations run automatically (creates all tables)
3. Go to `http://localhost:3002/register`
4. Fill: Organisation Name, Your Name, Email, Password → Submit
5. Sign in at `http://localhost:3002/signin`
6. Create workspaces and invite teammates
